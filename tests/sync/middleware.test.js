// Mock pg-pool to avoid real database connections
jest.mock('pg-pool', () => {
  const mockConnectFn = jest.fn();
  const MockPool = jest.fn().mockImplementation(() => ({
    connect: mockConnectFn
  }));
  MockPool.__mockConnect = mockConnectFn;
  return MockPool;
});

import { SQLEntity } from '../../dist/antity-pgsql.js';
import MockPool from 'pg-pool';
const pool = { connect: MockPool.__mockConnect };

describe("sync middleware", () => {
  const entity = new SQLEntity('persons', [
    {
      key: 'id',
      type: 'integer',
      min: 1,
      max: 999999999,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: ['PUT'],
      operations: ['SELECT', 'UPDATE'],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
    {
      key: 'name',
      type: 'string',
      min: 1,
      max: 255,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: ['POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
    {
      key: 'age',
      type: 'integer',
      min: 0,
      max: 120,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: ['POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null
    }
  ]);

  /**
   * Creates a mock database client that returns results sequentially per data query call.
   * BEGIN, COMMIT, and ROLLBACK are handled transparently.
   *
   * @param {object[][]} resultsQueue - Row arrays returned in order per data query call.
   * @returns {object} Mock client object with query and release spies.
   */
  const mockDbClient = (resultsQueue) => {
    let callIndex = 0;
    return {
      query: jest.fn().mockImplementation((sql) => {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK')
          return Promise.resolve({ rows: [], rowCount: 0 });
        const rows = resultsQueue[callIndex] ?? [];
        callIndex++;
        return Promise.resolve({ rows, rowCount: rows.length });
      }),
      release: jest.fn()
    };
  };

  /**
   * Creates a mock Express request object.
   *
   * @param {object[]} rows - Row objects to sync.
   * @param {string} [idField='id'] - Identity column name.
   * @param {object|null} [filters=null] - Optional filter scope.
   * @returns {object} Mock request object.
   */
  const mockRequest = (rows, idField = 'id', filters = null) => ({
    body: { rows, idField, filters }
  });

  /**
   * Creates a mock Express response object.
   *
   * @param {object} dbClient - Database client.
   * @param {number|string} [consumerId] - Consumer ID.
   * @param {string} [consumerName] - Consumer name.
   * @returns {object} Mock response object.
   */
  const mockResponse = (dbClient, consumerId, consumerName) => ({
    locals: {
      dbClient,
      consumerId,
      consumerName,
      rows: []
    }
  });

  /** @type {jest.Mock} */
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Transaction ──────────────────────────────────────────────────────────

  it("should wrap all operations in BEGIN / COMMIT", async () => {
    const dbClient = mockDbClient([
      [{ id: 1 }],  // SELECT existing ids
      [{ id: 2 }]   // INSERT RETURNING
    ]);
    const req = mockRequest([{ name: 'John', age: 30 }]);
    const res = mockResponse(dbClient);

    await entity.sync(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalledWith('BEGIN');
    expect(dbClient.query).toHaveBeenCalledWith('COMMIT');
    expect(dbClient.query).not.toHaveBeenCalledWith('ROLLBACK');
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should ROLLBACK and call next with error when a DB query fails", async () => {
    const dbClient = {
      query: jest.fn().mockImplementation((sql) => {
        if (sql === 'BEGIN' || sql === 'ROLLBACK') return Promise.resolve({ rows: [], rowCount: 0 });
        return Promise.reject(new Error('DB failure'));
      }),
      release: jest.fn()
    };
    const req = mockRequest([{ id: 1, name: 'John', age: 30 }]);
    const res = mockResponse(dbClient);

    await entity.sync(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalledWith('BEGIN');
    expect(dbClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(dbClient.query).not.toHaveBeenCalledWith('COMMIT');
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should release pool client acquired internally after success", async () => {
    const txClient = mockDbClient([[]]); // SELECT returns empty
    pool.connect.mockResolvedValue(txClient);

    // Pass no dbClient so sync acquires one from the pool
    const req = mockRequest([]);
    const res = { locals: { consumerId: 1, consumerName: 'admin', rows: [] } };

    await entity.sync(req, res, mockNext);

    expect(pool.connect).toHaveBeenCalled();
    expect(txClient.release).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should release pool client acquired internally after failure", async () => {
    const txClient = {
      query: jest.fn().mockImplementation((sql) => {
        if (sql === 'BEGIN' || sql === 'ROLLBACK') return Promise.resolve({ rows: [], rowCount: 0 });
        return Promise.reject(new Error('fail'));
      }),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(txClient);

    const req = mockRequest([{ id: 1, name: 'John', age: 30 }]);
    const res = { locals: { consumerId: 1, consumerName: 'admin', rows: [] } };

    await entity.sync(req, res, mockNext);

    expect(txClient.release).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  it("should call next with 400 when rows is null", async () => {
    const dbClient = mockDbClient([]);
    const req = mockRequest(null);
    const res = mockResponse(dbClient);

    await entity.sync(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(dbClient.query).not.toHaveBeenCalledWith('BEGIN');
  });

  it("should call next with 400 when rows is not an array", async () => {
    const dbClient = mockDbClient([]);
    const req = mockRequest('invalid');
    const res = mockResponse(dbClient);

    await entity.sync(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(dbClient.query).not.toHaveBeenCalledWith('BEGIN');
  });

  // ─── INSERT ───────────────────────────────────────────────────────────────

  it("should insert rows with no existing ID and assign returned IDs", async () => {
    const dbClient = mockDbClient([
      [],            // SELECT → no existing rows
      [{ id: 5 }]   // INSERT RETURNING
    ]);
    const req = mockRequest([{ name: 'Alice', age: 28 }]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    expect(res.locals.sync).toEqual({ inserted: 1, updated: 0, deleted: 0 });
    expect(res.locals.rows[0].id).toBe(5);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should insert rows whose ID is not in the existing set", async () => {
    const dbClient = mockDbClient([
      [{ id: 1 }],   // SELECT → id 1 exists
      [{ id: 99 }]   // INSERT RETURNING for the row with unknown id 50
    ]);
    // id=1 exists → update; id=50 unknown → insert
    const req = mockRequest([
      { id: 1, name: 'John', age: 30 },
      { id: 50, name: 'Ghost', age: 22 }
    ]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    expect(res.locals.sync).toEqual({ inserted: 1, updated: 1, deleted: 0 });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should include consumerId and consumerName in INSERT query args", async () => {
    const dbClient = mockDbClient([
      [],           // SELECT → no existing
      [{ id: 7 }]  // INSERT RETURNING
    ]);
    const req = mockRequest([{ name: 'Bob', age: 40 }]);
    const res = mockResponse(dbClient, 42, 'superadmin');

    await entity.sync(req, res, mockNext);

    // Find the INSERT call (not BEGIN/COMMIT/SELECT)
    const insertCall = dbClient.query.mock.calls.find(([sql]) =>
      sql.toUpperCase().startsWith('INSERT')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall[1]).toContain(42);
    expect(insertCall[1]).toContain('superadmin');
  });

  it("should not include consumerId and consumerName in INSERT args when undefined", async () => {
    const dbClient = mockDbClient([
      [],
      [{ id: 1 }]
    ]);
    const req = mockRequest([{ name: 'Carol', age: 25 }]);
    const res = mockResponse(dbClient, undefined, undefined);

    await entity.sync(req, res, mockNext);

    const insertCall = dbClient.query.mock.calls.find(([sql]) =>
      sql.toUpperCase().startsWith('INSERT')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall[1]).not.toContain(undefined);
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  it("should update rows whose ID is already in the database", async () => {
    const dbClient = mockDbClient([
      [{ id: 1 }, { id: 2 }] // SELECT → both exist
    ]);
    const req = mockRequest([
      { id: 1, name: 'John Updated', age: 31 },
      { id: 2, name: 'Jane Updated', age: 26 }
    ]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    expect(res.locals.sync).toEqual({ inserted: 0, updated: 2, deleted: 0 });
    expect(res.locals.rows).toHaveLength(2);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should include consumerId and consumerName in UPDATE query args", async () => {
    const dbClient = mockDbClient([[{ id: 1 }]]); // SELECT → id 1 exists
    const req = mockRequest([{ id: 1, name: 'Dave', age: 35 }]);
    const res = mockResponse(dbClient, 7, 'editor');

    await entity.sync(req, res, mockNext);

    const updateCall = dbClient.query.mock.calls.find(([sql]) =>
      sql.toUpperCase().startsWith('UPDATE')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall[1]).toContain(7);
    expect(updateCall[1]).toContain('editor');
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  it("should delete rows absent from the incoming list", async () => {
    const dbClient = mockDbClient([
      [{ id: 1 }, { id: 2 }, { id: 3 }] // SELECT → 3 existing
    ]);
    // Only id=1 sent → id=2 and id=3 must be deleted
    const req = mockRequest([{ id: 1, name: 'John', age: 30 }]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    expect(res.locals.sync).toEqual({ inserted: 0, updated: 1, deleted: 2 });

    const deleteCall = dbClient.query.mock.calls.find(([sql]) =>
      sql.toUpperCase().startsWith('DELETE')
    );
    expect(deleteCall).toBeDefined();
    expect(deleteCall[0]).toMatch(/ANY\(\$1\)/i);
    expect(deleteCall[1][0]).toEqual(expect.arrayContaining([2, 3]));
  });

  it("should delete all rows when incoming list is empty", async () => {
    const dbClient = mockDbClient([[{ id: 1 }, { id: 2 }]]);
    const req = mockRequest([]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    expect(res.locals.sync).toEqual({ inserted: 0, updated: 0, deleted: 2 });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should not issue a DELETE query when nothing needs to be deleted", async () => {
    const dbClient = mockDbClient([[{ id: 1 }]]); // SELECT → id 1 exists
    const req = mockRequest([{ id: 1, name: 'John', age: 30 }]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    const deleteCall = dbClient.query.mock.calls.find(([sql]) =>
      sql.toUpperCase().startsWith('DELETE')
    );
    expect(deleteCall).toBeUndefined();
  });

  // ─── Combined ─────────────────────────────────────────────────────────────

  it("should insert, update, and delete in the same request", async () => {
    const dbClient = mockDbClient([
      [{ id: 1 }, { id: 2 }], // SELECT → ids 1 and 2 exist
      [{ id: 3 }]              // INSERT RETURNING for new row
    ]);
    const req = mockRequest([
      { id: 1, name: 'John', age: 30 }, // update
      { name: 'New Person', age: 22 }   // insert (id=2 absent → delete)
    ]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    expect(res.locals.sync).toEqual({ inserted: 1, updated: 1, deleted: 1 });
    expect(res.locals.rows).toHaveLength(2);
    expect(res.locals.rows[1].id).toBe(3);
    expect(mockNext).toHaveBeenCalledWith();
  });

  // ─── idField ──────────────────────────────────────────────────────────────

  it("should use custom idField to identify existing rows", async () => {
    const dbClient = mockDbClient([
      [{ externalId: 'abc' }],  // SELECT using externalId
      [{ externalId: 'xyz' }]   // INSERT RETURNING
    ]);
    const req = mockRequest(
      [
        { externalId: 'abc', name: 'John', age: 30 }, // update
        { name: 'Jane', age: 25 }                      // insert (no externalId)
      ],
      'externalId'
    );
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    expect(res.locals.sync).toEqual({ inserted: 1, updated: 1, deleted: 0 });

    const selectCall = dbClient.query.mock.calls.find(([sql]) =>
      sql.toUpperCase().startsWith('SELECT')
    );
    expect(selectCall[0]).toMatch(/externalId/);
  });

  // ─── Filters ──────────────────────────────────────────────────────────────

  it("should add a WHERE clause to SELECT when filters are provided", async () => {
    const dbClient = mockDbClient([
      [{ id: 1 }] // SELECT (scoped)
    ]);
    const req = mockRequest(
      [{ id: 1, name: 'John', age: 30 }],
      'id',
      { age: { value: 18, matchMode: 'gte' } }
    );
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    const selectCall = dbClient.query.mock.calls.find(([sql]) =>
      sql.toUpperCase().startsWith('SELECT')
    );
    expect(selectCall[0]).toMatch(/WHERE/i);
    expect(selectCall[1]).toHaveLength(1); // one filter arg
  });

  it("should add AND filter condition to DELETE when filters are provided", async () => {
    const dbClient = mockDbClient([
      [{ id: 1 }, { id: 2 }] // SELECT scoped to age >= 18: both exist, only id=1 incoming
    ]);
    const req = mockRequest(
      [{ id: 1, name: 'John', age: 30 }],
      'id',
      { age: { value: 18, matchMode: 'gte' } }
    );
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    const deleteCall = dbClient.query.mock.calls.find(([sql]) =>
      sql.toUpperCase().startsWith('DELETE')
    );
    expect(deleteCall).toBeDefined();
    expect(deleteCall[0]).toMatch(/AND/i);
    // args[0] = ids array, args[1] = filter value
    expect(deleteCall[1][0]).toEqual(expect.arrayContaining([2]));
    expect(deleteCall[1][1]).toBe(18);
  });

  it("should not add WHERE to SELECT when no filters are provided", async () => {
    const dbClient = mockDbClient([[]]); // SELECT → empty
    const req = mockRequest([]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    const selectCall = dbClient.query.mock.calls.find(([sql]) =>
      sql.toUpperCase().startsWith('SELECT')
    );
    expect(selectCall[0]).not.toMatch(/WHERE/i);
    expect(selectCall[1]).toHaveLength(0);
  });

  // ─── res.locals ───────────────────────────────────────────────────────────

  it("should set res.locals.rows to the full incoming rows after sync", async () => {
    const dbClient = mockDbClient([[{ id: 1 }]]);
    const req = mockRequest([{ id: 1, name: 'John', age: 30 }]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    expect(res.locals.rows).toHaveLength(1);
    expect(res.locals.rows[0]).toMatchObject({ id: 1, name: 'John', age: 30 });
  });

  it("should set res.locals.sync with correct inserted/updated/deleted counts", async () => {
    const dbClient = mockDbClient([
      [{ id: 1 }, { id: 2 }],
      [{ id: 4 }]
    ]);
    const req = mockRequest([
      { id: 1, name: 'John', age: 30 },
      { name: 'New', age: 20 }
    ]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.sync(req, res, mockNext);

    expect(res.locals.sync).toEqual({ inserted: 1, updated: 1, deleted: 1 });
  });
});
