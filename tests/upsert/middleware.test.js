import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("upsert middleware", () => {
  const entity = new SQLEntity('persons', [
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
      normalizer: null,
      validator: null
    }
  ]);

  /**
   * Creates a mock database client returning generated IDs.
   *
   * @param {object[]} rowsToReturn - Rows returned by the DB (e.g. RETURNING id).
   * @returns {object} Mock client object.
   */
  const mockDbClient = (rowsToReturn = []) => ({
    query: jest.fn().mockResolvedValue({
      rows: rowsToReturn,
      rowCount: rowsToReturn.length
    })
  });

  /**
   * Creates a mock Express request object.
   *
   * @param {object[]} rows - Row objects to upsert.
   * @param {string|string[]|null} conflictTarget - Conflict target column(s).
   * @returns {object} Mock request object.
   */
  const mockRequest = (rows, conflictTarget) => ({
    body: { rows, conflictTarget }
  });

  /**
   * Creates a mock Express response object.
   *
   * @param {object|null} dbClient - Database client.
   * @param {number|string} [consumerId] - Consumer id.
   * @param {string} [consumerName] - Consumer nickname.
   * @returns {object} Mock response object.
   */
  const mockResponse = (dbClient, consumerId, consumerName) => ({
    locals: {
      dbClient,
      consumer: { id: consumerId, nickname: consumerName },
      rows: []
    }
  });

  /** @type {jest.Mock} */
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  it("should call next with 400 when conflictTarget is missing", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ name: 'John', age: 30, email: 'john@example.com' }], null);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.upsert(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(dbClient.query).not.toHaveBeenCalled();
  });

  it("should call next with 400 when rows is null", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest(null, 'email');
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.upsert(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(dbClient.query).not.toHaveBeenCalled();
  });

  it("should call next with 400 when rows is an empty array", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([], 'email');
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.upsert(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(dbClient.query).not.toHaveBeenCalled();
  });

  // ─── Success ──────────────────────────────────────────────────────────────

  it("should execute UPSERT query and call next() without error", async () => {
    const dbClient = mockDbClient([{ id: 1 }]);
    const req = mockRequest(
      [{ name: 'John', age: 30, email: 'john@example.com' }],
      'email'
    );
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.upsert(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should assign returned ids to res.locals.rows", async () => {
    const dbClient = mockDbClient([{ id: 5 }, { id: 6 }]);
    const req = mockRequest(
      [
        { name: 'Alice', age: 28, email: 'alice@example.com' },
        { name: 'Bob', age: 35, email: 'bob@example.com' }
      ],
      'email'
    );
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.upsert(req, res, mockNext);

    expect(res.locals.rows).toHaveLength(2);
    expect(res.locals.rows[0].id).toBe(5);
    expect(res.locals.rows[1].id).toBe(6);
  });

  it("should accept an array as conflictTarget", async () => {
    const dbClient = mockDbClient([{ id: 1 }]);
    const req = mockRequest(
      [{ name: 'John', age: 30, email: 'john@example.com' }],
      ['name', 'email']
    );
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.upsert(req, res, mockNext);

    const [sql] = dbClient.query.mock.calls[0];
    expect(sql).toContain('ON CONFLICT (name, email)');
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should include consumer id and nickname in the query args", async () => {
    const dbClient = mockDbClient([{ id: 1 }]);
    const req = mockRequest(
      [{ name: 'John', age: 30, email: 'john@example.com' }],
      'email'
    );
    const res = mockResponse(dbClient, 42, 'superadmin');

    await entity.upsert(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args).toContain(42);
    expect(args).toContain('superadmin');
  });

  it("should omit consumer from query args when undefined", async () => {
    const dbClient = mockDbClient([{ id: 1 }]);
    const req = mockRequest(
      [{ name: 'John', age: 30, email: 'john@example.com' }],
      'email'
    );
    const res = mockResponse(dbClient, undefined, undefined);

    await entity.upsert(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args).not.toContain(undefined);
  });

  it("should not mutate original row objects with consumer fields", async () => {
    const dbClient = mockDbClient([{ id: 1 }]);
    const inputRow = { name: 'Alice', age: 28, email: 'alice@example.com' };
    const req = mockRequest([inputRow], 'email');
    const res = mockResponse(dbClient, 7, 'tester');

    await entity.upsert(req, res, mockNext);

    expect(inputRow).not.toHaveProperty('consumerId');
    expect(inputRow).not.toHaveProperty('consumerName');
  });

  it("should split large batches into multiple chunks", async () => {
    const rows = Array.from({ length: 150 }, (_, i) => ({
      name: `Person${i}`,
      age: 20 + (i % 50),
      email: `person${i}@example.com`
    }));
    const dbClient = {
      query: jest.fn().mockResolvedValue({
        rows: Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
        rowCount: 100
      })
    };
    const req = mockRequest(rows, 'email');
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.upsert(req, res, mockNext);

    expect(dbClient.query.mock.calls.length).toBeGreaterThan(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next(error) when the database operation fails", async () => {
    const dbError = new Error('UPSERT failed');
    const dbClient = { query: jest.fn().mockRejectedValue(dbError) };
    const req = mockRequest(
      [{ name: 'Fail', age: 30, email: 'fail@example.com' }],
      'email'
    );
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.upsert(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });
});
