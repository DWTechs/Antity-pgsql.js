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

  /**
   * Mock next function
   * 
   * @type {jest.Mock}
   */
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should archive rows by setting archived to true", async () => {
    const inputRows = [
      { id: 1 },
      { id: 2 }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should archive a single row", async () => {
    const inputRows = [
      { id: 1 }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should archive multiple rows", async () => {
    const inputRows = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 2, 'multiConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should handle archiving with consumerId and consumerName", async () => {
    const inputRows = [
      { id: 10 },
      { id: 20 }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 123, 'adminUser');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    const callArgs = dbClient.query.mock.calls[0][1];
    
    // Verify archived value is set to true in the arguments
    expect(callArgs).toContain(true);
    // Verify consumerId is in the arguments
    expect(callArgs).toContain(123);
    // Verify consumerName is in the arguments
    expect(callArgs).toContain('adminUser');
  });

  it("should preserve additional properties in rows", async () => {
    const inputRows = [
      { id: 1, name: 'John', age: 30 }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should handle multiple chunks of rows", async () => {
    // Create a large batch that will require multiple chunks
    const inputRows = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1
    }));
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    // Verify multiple queries were executed (one per chunk)
    expect(dbClient.query.mock.calls.length).toBeGreaterThan(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next(error) when database operation fails", async () => {
    const inputRows = [
      { id: 1 },
      { id: 2 }
    ];
    
    const dbError = new Error('Database connection failed');
    const dbClient = {
      query: jest.fn().mockRejectedValue(dbError)
    };
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });

  it("should handle database client from res.locals", async () => {
    const inputRows = [
      { id: 5 }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should handle null database client", async () => {
    const inputRows = [
      { id: 1 }
    ];
    
    const req = mockRequest(inputRows);
    const res = mockResponse(null, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    // If dbClient is null, it should still try to execute
    // The execute function will handle the null client
    expect(mockNext).toHaveBeenCalled();
  });

  it("should archive rows with various ID types", async () => {
    const inputRows = [
      { id: 1 },
      { id: 999 },
      { id: 12345 }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should handle error in the middle of chunked processing", async () => {
    const inputRows = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1
    }));
    
    const dbError = new Error('Connection lost');
    const dbClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockRejectedValueOnce(dbError)
    };
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });

  it("should generate correct UPDATE query with archived flag", async () => {
    const inputRows = [
      { id: 1 },
      { id: 2 }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    const [query, args] = dbClient.query.mock.calls[0];
    
    // Verify the query is an UPDATE statement
    expect(query).toContain('UPDATE');
    expect(query).toContain('public.persons');
    expect(query).toContain('SET');
    
    // Verify arguments contain the archived flag
    expect(args).toContain(true);
  });

  it("should handle rows already having archived property", async () => {
    const inputRows = [
      { id: 1, archived: false },
      { id: 2, archived: false }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    const [, args] = dbClient.query.mock.calls[0];
    
    // Verify archived is set to true regardless of original value
    expect(args.filter(arg => arg === true).length).toBeGreaterThan(0);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should handle empty consumerId and consumerName gracefully", async () => {
    const inputRows = [
      { id: 1 }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, undefined, undefined);

    await entity.archive(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should process all chunks sequentially without race conditions", async () => {
    const inputRows = Array.from({ length: 250 }, (_, i) => ({
      id: i + 1
    }));
    
    let callOrder = 0;
    const dbClient = {
      query: jest.fn().mockImplementation(async () => {
        callOrder++;
        // Simulate async delay
        await new Promise(resolve => setTimeout(resolve, 10));
        return { rows: [], rowCount: 0 };
      })
    };
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.archive(req, res, mockNext);

    // Verify all chunks were processed
    expect(dbClient.query).toHaveBeenCalled();
    expect(callOrder).toBeGreaterThan(1);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
