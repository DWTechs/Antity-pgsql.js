import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("archive middleware", () => {
  const entity = new SQLEntity('persons', [
    {
      key: 'id',
      type: 'number',
      min: 1,
      max: 255,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: [],
      operations: ['SELECT', 'DELETE'],
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
      normalizer: val => val.toLowerCase(),
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
      operations: ['SELECT', 'UPDATE'],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
    {
      key: 'archived',
      type: 'boolean',
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: ['PUT'],
      operations: ['UPDATE'],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null
    }
  ]);

  /**
   * Mock database client
   *
   * @returns {object} Mock client object
   */
  const mockDbClient = () => ({
    query: jest.fn().mockResolvedValue({
      rows: [],
      rowCount: 0
    })
  });

  /**
   * Creates mock Express request object
   *
   * @param {object[]} rows - Array of row objects to archive
   * @returns {object} Mock request object
   */
  const mockRequest = (rows) => ({
    body: { rows }
  });

  /**
   * Creates mock Express response object
   *
   * @param {object} dbClient - Database client
   * @param {number|string} [consumerId] - Consumer ID
   * @param {string} [consumerName] - Consumer name
   * @returns {object} Mock response object
   */
  const mockResponse = (dbClient, consumerId, consumerName) => ({
    locals: {
      dbClient,
      consumerId,
      consumerName
    }
  });

  /** @type {jest.Mock} */
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should execute UPDATE query and call next() without error", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ id: 1 }, { id: 2 }]);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should set archived to true and include consumerId and consumerName in query args", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ id: 10 }, { id: 20 }]);
    const res = mockResponse(dbClient, 123, 'adminUser');

    await entity.archive(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args).toContain(true);
    expect(args).toContain(123);
    expect(args).toContain('adminUser');
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should overwrite existing archived=false with true", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ id: 1, archived: false }, { id: 2, archived: false }]);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args.filter(arg => arg === false)).toHaveLength(0);
    expect(args).toContain(true);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should omit consumerId and consumerName from query args when undefined", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ id: 1 }]);
    const res = mockResponse(dbClient, undefined, undefined);

    await entity.archive(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args).toContain(true);
    expect(args).not.toContain(undefined);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should split rows into multiple chunks and execute one query per chunk", async () => {
    const inputRows = Array.from({ length: 150 }, (_, i) => ({ id: i + 1 }));
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query.mock.calls.length).toBeGreaterThan(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next(error) when the database operation fails", async () => {
    const dbError = new Error('Database connection failed');
    const dbClient = { query: jest.fn().mockRejectedValue(dbError) };
    const req = mockRequest([{ id: 1 }, { id: 2 }]);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });

  it("should call next(error) when the database fails on a subsequent chunk", async () => {
    const inputRows = Array.from({ length: 150 }, (_, i) => ({ id: i + 1 }));
    const dbError = new Error('Connection lost');
    const dbClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockRejectedValueOnce(dbError)
    };
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });

  it("should call next(error) when dbClient is null and the pool is unavailable", async () => {
    const req = mockRequest([{ id: 1 }]);
    const res = mockResponse(null, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
