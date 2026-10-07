import {
  SQLEntity,
  groupHistoryByAction,
  filterMeaningfulHistory,
} from '../../dist/antity-pgsql.js';

const makeEntity = (schema) => new SQLEntity('route', [
  { key: 'id', type: 'integer', isTypeChecked: true, isFilterable: true, operations: ['SELECT'] },
], schema);

const mockClient = (result) => ({ query: jest.fn().mockResolvedValue(result) });
const mockRes = (client) => ({ locals: { dbClient: client } });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const row = (over = {}) => ({
  id: 1,
  tstamp: '2024-01-01T00:00:00.000Z',
  operation: 'INSERT',
  userId: 1,
  userName: 'admin',
  record: { id: 1, name: 'a' },
  ...over,
});

describe('SQLEntity.getHistory / history()', () => {
  const next = jest.fn();
  beforeEach(() => next.mockReset());

  describe('request handling', () => {
    it('should call next with 400 when the id param is missing', () => {
      makeEntity().getHistory({ params: {} }, mockRes(mockClient({ rows: [], rowCount: 0 })), next);
      expect(next).toHaveBeenCalledWith({ statusCode: 400, message: 'Missing id' });
    });

    it.each(['abc', '1.5', '-1', '1 OR 1=1', '2147483648'])('should call next with 400 and not query when the id is not a valid integer (%j)', (id) => {
      const client = mockClient({ rows: [], rowCount: 0 });
      makeEntity().getHistory({ params: { id } }, mockRes(client), next);
      expect(next).toHaveBeenCalledWith({ statusCode: 400, message: 'Invalid id' });
      expect(client.query).not.toHaveBeenCalled();
    });

    it('should call next with 400 naming the field when a custom field param is not an integer', () => {
      const client = mockClient({ rows: [], rowCount: 0 });
      makeEntity().history({ field: 'routeId' })({ params: { routeId: 'x' } }, mockRes(client), next);
      expect(next).toHaveBeenCalledWith({ statusCode: 400, message: 'Invalid routeId' });
      expect(client.query).not.toHaveBeenCalled();
    });

    it('should query the entity table in the default public schema', async () => {
      const client = mockClient({ rows: [], rowCount: 0 });
      makeEntity().getHistory({ params: { id: '7' } }, mockRes(client), next);
      await flush();
      const [sql, args] = client.query.mock.calls[0];
      expect(sql).toContain('FROM log.history');
      expect(sql).toContain('SELECT id, tstamp, operation, "userId", "userName", record');
      expect(sql).not.toContain('consumer');
      expect(args).toEqual(['public', ['route'], 'id', '7']);
    });

    it('should query with the entity custom schema', async () => {
      const client = mockClient({ rows: [], rowCount: 0 });
      makeEntity('myschema').getHistory({ params: { id: 1 } }, mockRes(client), next);
      await flush();
      expect(client.query.mock.calls[0][1][0]).toBe('myschema');
    });

    it('should follow table/schema setters made after construction', async () => {
      const client = mockClient({ rows: [], rowCount: 0 });
      const entity = makeEntity();
      entity.table = 'routes_v2';
      entity.schema = 'other';
      entity.getHistory({ params: { id: 1 } }, mockRes(client), next);
      await flush();
      expect(client.query.mock.calls[0][1].slice(0, 2)).toEqual(['other', ['routes_v2']]);
    });

    it('should call next with 404 when there is no history', async () => {
      makeEntity().getHistory({ params: { id: 1 } }, mockRes(mockClient({ rows: [], rowCount: 0 })), next);
      await flush();
      expect(next).toHaveBeenCalledWith({ statusCode: 404, message: 'history not found' });
    });

    it('should call next with 404 when the only entry is the initial INSERT', async () => {
      const rows = [row()];
      makeEntity().getHistory({ params: { id: 1 } }, mockRes(mockClient({ rows, rowCount: 1 })), next);
      await flush();
      expect(next).toHaveBeenCalledWith({ statusCode: 404, message: 'history not found' });
    });

    it('should set res.locals.rows and total, and call next() when history exists beyond the INSERT', async () => {
      const rows = [
        row(),
        row({ id: 2, tstamp: '2024-01-02T00:00:00.000Z', operation: 'UPDATE', record: { id: 1, name: 'b' } }),
      ];
      const res = mockRes(mockClient({ rows, rowCount: 2 }));
      makeEntity().getHistory({ params: { id: 1 } }, res, next);
      await flush();
      expect(res.locals.rows).toHaveLength(2);
      expect(res.locals.total).toBe(2);
      expect(res.locals.rows[1].operation).toBe('UPDATE');
      expect(next).toHaveBeenCalledWith();
    });

    it('should merge rows written by the same transaction into one entry', async () => {
      const rows = [
        row(),
        row({ id: 2, tstamp: '2024-01-02T00:00:00.000Z', operation: 'UPDATE', record: { id: 1, name: 'b' } }),
        row({ id: 3, tstamp: '2024-01-02T00:00:00.000Z', operation: 'UPDATE', record: { id: 1, methodId: 9 } }),
      ];
      const res = mockRes(mockClient({ rows, rowCount: 3 }));
      makeEntity().getHistory({ params: { id: 1 } }, res, next);
      await flush();
      expect(res.locals.total).toBe(2);
      expect(res.locals.rows[1].record).toEqual({ id: 1, name: 'b', methodId: 9 });
    });

    it('should call next(err) when the query rejects', async () => {
      const err = new Error('boom');
      makeEntity().getHistory({ params: { id: 1 } }, mockRes({ query: jest.fn().mockRejectedValue(err) }), next);
      await flush();
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('history(options)', () => {
    it('should read several tables at once', async () => {
      const client = mockClient({ rows: [], rowCount: 0 });
      const tables = ['route', 'route_operation', 'route_method'];
      makeEntity().history({ tables })({ params: { id: 1 } }, mockRes(client), next);
      await flush();
      expect(client.query.mock.calls[0][1][1]).toEqual(tables);
    });

    it('should match another record field, read from the same-named req.params, bound as a parameter', async () => {
      const client = mockClient({ rows: [], rowCount: 0 });
      makeEntity().history({ tables: ['permission'], field: 'routeId' })({ params: { routeId: '3' } }, mockRes(client), next);
      await flush();
      const [sql, args] = client.query.mock.calls[0];
      expect(sql).toContain('record->>$3::text');
      expect(sql).not.toContain('routeId');
      expect(args).toEqual(['public', ['permission'], 'routeId', '3']);
    });

    it('should call next with 400 naming the field when its param is missing', () => {
      makeEntity().history({ field: 'routeId' })({ params: { id: 1 } }, mockRes(mockClient({ rows: [], rowCount: 0 })), next);
      expect(next).toHaveBeenCalledWith({ statusCode: 400, message: 'Missing routeId' });
    });

    it.each(["id; DROP TABLE x", "a b", "1abc", "route-id", ""])('should throw when field is not a SQL identifier (%j)', (field) => {
      expect(() => makeEntity().history({ field })).toThrow('history field must be a valid SQL identifier');
    });

    it('should drop entries that only changed ignored columns', async () => {
      const rows = [
        row({ record: { id: 1, name: 'a', lastLoginAt: 1 } }),
        row({ id: 2, tstamp: '2024-01-02T00:00:00.000Z', operation: 'UPDATE', record: { id: 1, name: 'a', lastLoginAt: 2 } }),
        row({ id: 3, tstamp: '2024-01-03T00:00:00.000Z', operation: 'UPDATE', record: { id: 1, name: 'b', lastLoginAt: 2 } }),
      ];
      const res = mockRes(mockClient({ rows, rowCount: 3 }));
      makeEntity().history({ ignoreCols: ['lastLoginAt'] })({ params: { id: 1 } }, res, next);
      await flush();
      expect(res.locals.rows.map((r) => r.id)).toEqual([1, 3]);
    });

    it('should always ignore updatedAt/updaterId/updaterName', async () => {
      const rows = [
        row({ record: { id: 1, name: 'a', updatedAt: 1, updaterId: 1, updaterName: 'x' } }),
        row({ id: 2, tstamp: '2024-01-02T00:00:00.000Z', operation: 'UPDATE', record: { id: 1, name: 'a', updatedAt: 2, updaterId: 2, updaterName: 'y' } }),
      ];
      const res = mockRes(mockClient({ rows, rowCount: 2 }));
      makeEntity().getHistory({ params: { id: 1 } }, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith({ statusCode: 404, message: 'history not found' });
    });
  });
});

describe('groupHistoryByAction', () => {
  it('should return one entry per row when tstamp/userId/record.id all differ', () => {
    const rows = [
      row({ id: 1, tstamp: 'a', userId: 1, record: { id: 1 } }),
      row({ id: 2, tstamp: 'b', userId: 2, record: { id: 2 } }),
    ];
    expect(groupHistoryByAction(rows)).toHaveLength(2);
  });

  it('should merge rows sharing tstamp/userId/record.id and keep the first row metadata', () => {
    const rows = [
      row({ id: 1, operation: 'UPDATE', record: { id: 1, name: 'b' } }),
      row({ id: 2, operation: 'INSERT', record: { id: 1, methodId: 9 } }),
    ];
    const out = groupHistoryByAction(rows);
    expect(out).toEqual([
      { id: 1, tstamp: rows[0].tstamp, operation: 'UPDATE', userId: 1, userName: 'admin', record: { id: 1, name: 'b', methodId: 9 } },
    ]);
  });

  it('should keep rows separate when record.id differs even if tstamp/userId match', () => {
    const rows = [row({ id: 1, record: { id: 1 } }), row({ id: 2, record: { id: 2 } })];
    expect(groupHistoryByAction(rows)).toHaveLength(2);
  });

  it('should treat a Date and its ISO string as the same tstamp', () => {
    const iso = '2024-01-01T00:00:00.000Z';
    const rows = [row({ id: 1, tstamp: new Date(iso) }), row({ id: 2, tstamp: iso, record: { id: 1, x: 1 } })];
    expect(groupHistoryByAction(rows)).toHaveLength(1);
  });

  it('should not mutate the input rows', () => {
    const rows = [row({ record: { id: 1 } }), row({ id: 2, record: { id: 1, x: 1 } })];
    groupHistoryByAction(rows);
    expect(rows[0].record).toEqual({ id: 1 });
  });
});

describe('filterMeaningfulHistory', () => {
  const rec = (over) => row({ record: { id: 1, name: 'a', ...over } });

  it('should always keep the first entry', () => {
    expect(filterMeaningfulHistory([rec()])).toHaveLength(1);
    expect(filterMeaningfulHistory([])).toEqual([]);
  });

  it('should drop later entries that only change ignored columns', () => {
    const rows = [rec({ x: 1 }), rec({ x: 2 })];
    expect(filterMeaningfulHistory(rows, ['x'])).toHaveLength(1);
  });

  it('should keep an entry that changes a non-ignored column, then compare against it', () => {
    const rows = [rec({ x: 1 }), rec({ name: 'b', x: 2 }), rec({ name: 'b', x: 3 })];
    expect(filterMeaningfulHistory(rows, ['x']).map((r) => r.record.name)).toEqual(['a', 'b']);
  });

  it('should not treat equal array/object values as a change', () => {
    const rows = [rec({ tags: ['a', 'b'], meta: { k: 1 } }), rec({ tags: ['a', 'b'], meta: { k: 1 } })];
    expect(filterMeaningfulHistory(rows)).toHaveLength(1);
  });

  it('should keep an entry whose array/object value changed', () => {
    const rows = [rec({ tags: ['a'] }), rec({ tags: ['a', 'b'] })];
    expect(filterMeaningfulHistory(rows)).toHaveLength(2);
  });

  it('should always ignore updatedAt/updaterId/updaterName and default to no extra ignored columns', () => {
    const rows = [rec({ updatedAt: 1, updaterId: 1, updaterName: 'x' }), rec({ updatedAt: 2, updaterId: 2, updaterName: 'y' })];
    expect(filterMeaningfulHistory(rows)).toHaveLength(1);
    expect(filterMeaningfulHistory([rec({ x: 1 }), rec({ x: 2 })])).toHaveLength(2);
  });
});
