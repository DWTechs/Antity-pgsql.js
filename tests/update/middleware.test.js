import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("update middleware", () => {
  const entity = new SQLEntity('persons', [
    {
      key: 'id',
      type: 'integer',
      min: 1,
      max: 999999999,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: [],
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
      requiredFor: ['PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null
    }
  ]);

  /**
   * Creates a mock database client that resolves successfully.
   *
   * @returns {object} Mock client object.
   */
  const mockDbClient = () => ({
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
  });

  /**
   * Creates a mock Express request object.
   *
   * @param {object[]} rows - Array of row objects to update.
   * @returns {object} Mock request object.
   */
  const mockRequest = (rows) => ({
    body: { rows }
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

  it("should execute UPDATE query and call next() without error", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ id: 1, name: 'John', age: 31 }]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.update(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should set res.locals.rows to the input rows after update", async () => {
    const dbClient = mockDbClient();
    const inputRows = [
      { id: 1, name: 'John Updated', age: 31 },
      { id: 2, name: 'Jane Updated', age: 26 }
    ];
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.update(req, res, mockNext);

    expect(res.locals.rows).toBe(inputRows);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should include consumer id and nickname in the query args", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ id: 1, name: 'Alice', age: 28 }]);
    const res = mockResponse(dbClient, 99, 'superadmin');

    await entity.update(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args).toContain(99);
    expect(args).toContain('superadmin');
  });

  it("should omit consumer from query args when undefined", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ id: 1, name: 'Bob', age: 40 }]);
    const res = mockResponse(dbClient, undefined, undefined);

    await entity.update(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args).not.toContain(undefined);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should split large batches into multiple chunks", async () => {
    const inputRows = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      name: `Person${i}`,
      age: 20 + (i % 50)
    }));
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.update(req, res, mockNext);

    expect(dbClient.query.mock.calls.length).toBeGreaterThan(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next(error) when the database operation fails", async () => {
    const dbError = new Error('Database connection failed');
    const dbClient = { query: jest.fn().mockRejectedValue(dbError) };
    const req = mockRequest([{ id: 1, name: 'Fail', age: 30 }]);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.update(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });

  it("should call next(error) when the database fails on a subsequent chunk", async () => {
    const inputRows = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      name: `Person${i}`,
      age: 20
    }));
    const dbError = new Error('Connection lost');
    const dbClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockRejectedValueOnce(dbError)
    };
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.update(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });

  it("should not mutate original row objects with consumer fields", async () => {
    const dbClient = mockDbClient();
    const inputRow = { id: 1, name: 'Alice', age: 28 };
    const req = mockRequest([inputRow]);
    const res = mockResponse(dbClient, 7, 'tester');

    await entity.update(req, res, mockNext);

    expect(inputRow).not.toHaveProperty('consumerId');
    expect(inputRow).not.toHaveProperty('consumerName');
  });

  it("should support the updateOneSubstack shape (req.body is the single row, no rows wrapper)", async () => {
    const dbClient = mockDbClient();
    const req = { body: { id: 1, name: 'John', age: 31 } };
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.update(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next with 400 when req.body.rows is an invalid (non-array) value", async () => {
    const dbClient = mockDbClient();
    const req = { body: { rows: null } };
    const res = mockResponse(dbClient, 1, 'admin');

    await entity.update(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(dbClient.query).not.toHaveBeenCalled();
  });
});
