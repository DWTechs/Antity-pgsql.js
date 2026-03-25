import { SQLEntity } from '../../dist/antity-pgsql.js';

// Mock pg-pool to avoid real database connections
jest.mock('pg-pool', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn()
  }));
});

describe("syncArraySubstack", () => {
  const entity = new SQLEntity('users', [
    {
      key: 'id',
      type: 'integer',
      min: 1,
      max: 999999999,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: ['PUT'],
      operations: ['SELECT', 'UPDATE', 'DELETE'],
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
      normalizer: val => val.trim().toLowerCase(),
      validator: null
    },
    {
      key: 'email',
      type: 'email',
      min: 5,
      max: 255,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: ['POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      isPrivate: false,
      sanitizer: null,
      normalizer: val => val.trim().toLowerCase(),
      validator: null
    },
    {
      key: 'age',
      type: 'integer',
      min: 18,
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
   * Creates a mock database client that returns a sequence of results per query call.
   * Includes BEGIN/COMMIT/ROLLBACK support for transaction testing.
   *
   * @param {object[][]} resultsQueue - Array of row arrays returned in order per data query call.
   * @returns {object} Mock client object.
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
   * @param {object[]} rows - Array of row objects to sync.
   * @param {string} [idField='id'] - The field used to identify existing rows.
   * @param {object|null} [filters=null] - Optional filters to scope the sync.
   * @returns {object} Mock request object.
   */
  const mockRequest = (rows, idField = 'id', filters = null) => ({
    body: { rows, idField, filters },
    method: 'PUT'
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

  /**
   * Creates a mock Express next function.
   *
   * @returns {function} Mock next function.
   */
  const mockNext = () => jest.fn();

  it("should insert new rows, update existing rows, and delete removed rows", async () => {
    // Existing DB state: ids 1 and 2
    // Incoming: id=1 (update), id=3 (new without id → insert), id=2 absent → delete
    const rowsToSync = [
      { id: 1, name: '  JOHN  ', email: '  JOHN@EXAMPLE.COM  ', age: 30 },
      { name: '  JANE  ', email: '  JANE@EXAMPLE.COM  ', age: 25 }
    ];

    // Query sequence: SELECT ids → [{ id: 1 }, { id: 2 }], INSERT RETURNING → [{ id: 3 }]
    const dbClient = mockDbClient([
      [{ id: 1 }, { id: 2 }], // SELECT existing ids
      [{ id: 3 }],            // INSERT RETURNING new row
                              // UPDATE has no return, DELETE has no return
    ]);

    const req = mockRequest(rowsToSync);
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeArray, validateArray, sync] = entity.syncArraySubstack;

    normalizeArray(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.rows[0].name).toBe('john');
    expect(req.body.rows[0].email).toBe('john@example.com');
    expect(req.body.rows[1].name).toBe('jane');
    expect(req.body.rows[1].email).toBe('jane@example.com');

    next.mockClear();
    validateArray(req, res, next);
    expect(next).toHaveBeenCalled();

    next.mockClear();
    await sync(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.rows).toHaveLength(2);
    expect(res.locals.sync).toEqual({ inserted: 1, updated: 1, deleted: 1 });
    // New row should have received the generated id
    expect(res.locals.rows[1].id).toBe(3);
    // Transaction: BEGIN and COMMIT must have been called
    expect(dbClient.query).toHaveBeenCalledWith('BEGIN');
    expect(dbClient.query).toHaveBeenCalledWith('COMMIT');
    expect(dbClient.query).not.toHaveBeenCalledWith('ROLLBACK');
  });

  it("should only insert when no existing rows", async () => {
    const rowsToSync = [
      { name: 'alice', email: 'alice@example.com', age: 22 }
    ];

    const dbClient = mockDbClient([
      [],            // SELECT existing ids → empty
      [{ id: 10 }]  // INSERT RETURNING
    ]);

    const req = mockRequest(rowsToSync);
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeArray, validateArray, sync] = entity.syncArraySubstack;

    normalizeArray(req, res, next);
    next.mockClear();
    validateArray(req, res, next);
    next.mockClear();
    await sync(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.sync).toEqual({ inserted: 1, updated: 0, deleted: 0 });
    expect(res.locals.rows[0].id).toBe(10);
    expect(dbClient.query).toHaveBeenCalledWith('BEGIN');
    expect(dbClient.query).toHaveBeenCalledWith('COMMIT');
  });

  it("should only delete when incoming rows is empty", async () => {
    const rowsToSync = [];

    const dbClient = mockDbClient([
      [{ id: 1 }, { id: 2 }] // SELECT existing ids
    ]);

    const req = mockRequest(rowsToSync);
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeArray, validateArray, sync] = entity.syncArraySubstack;

    normalizeArray(req, res, next);
    next.mockClear();
    validateArray(req, res, next);
    next.mockClear();
    await sync(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.sync).toEqual({ inserted: 0, updated: 0, deleted: 2 });
    expect(res.locals.rows).toHaveLength(0);
    expect(dbClient.query).toHaveBeenCalledWith('BEGIN');
    expect(dbClient.query).toHaveBeenCalledWith('COMMIT');
  });

  it("should only update when all incoming rows already exist", async () => {
    const rowsToSync = [
      { id: 1, name: 'john', email: 'john@example.com', age: 31 },
      { id: 2, name: 'jane', email: 'jane@example.com', age: 26 }
    ];

    const dbClient = mockDbClient([
      [{ id: 1 }, { id: 2 }] // SELECT existing ids
    ]);

    const req = mockRequest(rowsToSync);
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeArray, validateArray, sync] = entity.syncArraySubstack;

    normalizeArray(req, res, next);
    next.mockClear();
    validateArray(req, res, next);
    next.mockClear();
    await sync(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.sync).toEqual({ inserted: 0, updated: 2, deleted: 0 });
    expect(res.locals.rows).toHaveLength(2);
    expect(dbClient.query).toHaveBeenCalledWith('BEGIN');
    expect(dbClient.query).toHaveBeenCalledWith('COMMIT');
  });

  it("should call next with error when rows is not an array", async () => {
    const dbClient = mockDbClient([]);
    const req = { body: { rows: null }, method: 'PUT' };
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [, , sync] = entity.syncArraySubstack;

    await sync(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 400 })
    );
    // Validation happens before the transaction — no BEGIN should be issued
    expect(dbClient.query).not.toHaveBeenCalledWith('BEGIN');
  });

  it("should ROLLBACK and call next with error when a DB operation fails", async () => {
    const dbClient = {
      query: jest.fn().mockImplementation((sql) => {
        if (sql === 'BEGIN' || sql === 'ROLLBACK') return Promise.resolve({ rows: [], rowCount: 0 });
        return Promise.reject(new Error('DB failure'));
      }),
      release: jest.fn()
    };

    const req = mockRequest([{ id: 1, name: 'john', email: 'john@example.com', age: 30 }]);
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [, , sync] = entity.syncArraySubstack;
    await sync(req, res, next);

    expect(dbClient.query).toHaveBeenCalledWith('BEGIN');
    expect(dbClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(dbClient.query).not.toHaveBeenCalledWith('COMMIT');
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should scope the SELECT and DELETE with provided filters", async () => {
    // Existing rows for age >= 30: ids 1 and 2
    // Incoming: id=1 remains, id=2 absent → should only delete id=2 within the scoped filter
    const rowsToSync = [
      { id: 1, name: 'john', email: 'john@example.com', age: 30 }
    ];

    const filters = {
      age: { value: 30, matchMode: 'gte' }
    };

    // SELECT returns only the filter-scoped ids
    const dbClient = mockDbClient([
      [{ id: 1 }, { id: 2 }] // SELECT existing ids (filtered to age >= 30)
      // UPDATE for id=1, DELETE for id=2
    ]);

    const req = mockRequest(rowsToSync, 'id', filters);
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeArray, validateArray, sync] = entity.syncArraySubstack;

    normalizeArray(req, res, next);
    next.mockClear();
    validateArray(req, res, next);
    next.mockClear();
    await sync(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.sync).toEqual({ inserted: 0, updated: 1, deleted: 1 });

    const calls = dbClient.query.mock.calls;

    // First call is BEGIN
    expect(calls[0][0]).toBe('BEGIN');

    // Second call is the scoped SELECT — must contain a WHERE clause
    const selectCall = calls[1];
    expect(selectCall[0]).toMatch(/WHERE/i);
    expect(selectCall[1]).toHaveLength(1); // one filter arg

    // Second-to-last call is the scoped DELETE — must contain AND for the filter
    const deleteCall = calls[calls.length - 2];
    expect(deleteCall[0]).toMatch(/AND/i);

    // Last call is COMMIT
    expect(calls[calls.length - 1][0]).toBe('COMMIT');
    expect(dbClient.query).not.toHaveBeenCalledWith('ROLLBACK');
  });
});
