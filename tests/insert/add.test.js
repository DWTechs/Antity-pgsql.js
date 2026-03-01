import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("add method", () => {
  const entity = new SQLEntity('persons', [
    {
      key: 'id',
      type: 'integer',
      min: 1,
      max: 0,
      typeCheck: true,
      filter: true,
      need: [],
      operations: ['SELECT'],
      send: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
    {
      key: 'name',
      type: 'string',
      min: 1,
      max: 255,
      typeCheck: true,
      filter: true,
      need: ['POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      send: true,
      safe: true,
      sanitizer: null,
      normalizer: val => val.toLowerCase(),
      validator: null
    },
    {
      key: 'age',
      type: 'integer',
      min: 0,
      max: 120,
      typeCheck: true,
      filter: true,
      need: ['POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      send: true,
      safe: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    }
  ]);

  /**
   * Mock database client
   * 
   * @param {object[]} rowsToReturn - Array of rows with generated IDs to return
   * @returns {object} Mock client object
   */
  const mockDbClient = (rowsToReturn) => ({
    query: jest.fn().mockResolvedValue({
      rows: rowsToReturn,
      rowCount: rowsToReturn.length
    })
  });

  /**
   * Creates mock Express request object
   * 
   * @param {object[]} rows - Array of row objects to insert
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
      consumerName,
      rows: []
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

  it("should add rows to res.locals.rows with generated IDs", async () => {
    const inputRows = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ];
    
    const generatedIds = [{ id: 1 }, { id: 2 }];
    const dbClient = mockDbClient(generatedIds);
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    expect(req.body.rows).toEqual(inputRows);

    await entity.add(req, res, mockNext);

    expect(res.locals.rows).toBeDefined();
    expect(res.locals.rows).toHaveLength(2);
    expect(res.locals.rows[0]).toEqual({ name: 'John', age: 30, id: 1, consumerId: 1, consumerName: 'testConsumer' });
    expect(res.locals.rows[1]).toEqual({ name: 'Jane', age: 25, id: 2, consumerId: 1, consumerName: 'testConsumer' });
  });

  it("should add rows to res.locals.rows with generated IDs for 1 row", async () => {
    const inputRows = [
      { name: 'John', age: 30 }
    ];
    
    const generatedIds = [{ id: 1 }];
    const dbClient = mockDbClient(generatedIds);
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    expect(req.body.rows).toEqual(inputRows);

    await entity.add(req, res, mockNext);

    expect(res.locals.rows).toBeDefined();
    expect(res.locals.rows[0]).toEqual({ name: 'John', age: 30, id: 1, consumerId: 1, consumerName: 'testConsumer' });
  });

  it("should preserve original row data while adding IDs", async () => {
    const inputRows = [
      { name: 'Alice', age: 28, email: 'alice@test.com' }
    ];
    
    const generatedIds = [{ id: 42 }];
    const dbClient = mockDbClient(generatedIds);
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    expect(req.body.rows).toEqual(inputRows);

    await entity.add(req, res, mockNext);

    expect(res.locals.rows[0]).toEqual({
      name: 'Alice',
      age: 28,
      email: 'alice@test.com',
      id: 42,
      consumerId: 1,
      consumerName: 'testConsumer'
    });
  });

  it("should handle multiple chunks of rows", async () => {
    // Create a large batch that will be chunked
    const inputRows = Array.from({ length: 150 }, (_, i) => ({
      name: `Person${i}`,
      age: 20 + (i % 50)
    }));
    
    // Mock returns for multiple chunks
    const generatedIds = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
    const generatedIds2 = Array.from({ length: 50 }, (_, i) => ({ id: i + 101 }));
    
    const dbClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: generatedIds, total: 100 })
        .mockResolvedValueOnce({ rows: generatedIds2, total: 50 })
    };
    
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    expect(req.body.rows).toEqual(inputRows);
    expect(req.body.rows).toHaveLength(150);

    await entity.add(req, res, mockNext);

    expect(res.locals.rows).toHaveLength(150);
    expect(res.locals.rows[0].id).toBe(1);
    expect(res.locals.rows[99].id).toBe(100);
    expect(res.locals.rows[100].id).toBe(101);
    expect(res.locals.rows[149].id).toBe(150);
  });

  it("should call next() after successful insertion", async () => {
    const inputRows = [{ name: 'Bob', age: 35 }];
    const generatedIds = [{ id: 5 }];
    const dbClient = mockDbClient(generatedIds);
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    await entity.add(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next(error) when database operation fails", async () => {
    const inputRows = [{ name: 'Error', age: 30 }];
    const dbError = new Error('Database connection failed');
    const dbClient = {
      query: jest.fn().mockRejectedValue(dbError)
    };
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    expect(req.body.rows).toEqual(inputRows);

    await entity.add(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(dbError);
    expect(res.locals.rows).toEqual([]);
  });

  it("should flatten chunked results into a single array", async () => {
    const inputRows = Array.from({ length: 3 }, (_, i) => ({
      name: `User${i}`,
      age: 20 + i
    }));
    
    const generatedIds = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const dbClient = mockDbClient(generatedIds);
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    expect(req.body.rows).toEqual(inputRows);

    await entity.add(req, res, mockNext);

    expect(Array.isArray(res.locals.rows)).toBe(true);
    expect(res.locals.rows).toHaveLength(3);
    expect(res.locals.rows[0]).toHaveProperty('id');
    expect(res.locals.rows[1]).toHaveProperty('id');
    expect(res.locals.rows[2]).toHaveProperty('id');
    // Verify none of the elements are arrays (checking it's flat)
    expect(res.locals.rows.every(row => !Array.isArray(row))).toBe(true);
  });

  it("should handle rows without consumerId and consumerName", async () => {
    const inputRows = [{ name: 'NoConsumer', age: 40 }];
    const generatedIds = [{ id: 10 }];
    const dbClient = mockDbClient(generatedIds);
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, undefined, undefined);

    expect(req.body.rows).toEqual(inputRows);

    await entity.add(req, res, mockNext);

    expect(res.locals.rows).toHaveLength(1);
    expect(res.locals.rows[0]).toEqual({ name: 'NoConsumer', age: 40, id: 10 });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should correctly match IDs to their respective rows in the same order", async () => {
    const inputRows = [
      { name: 'First', age: 10 },
      { name: 'Second', age: 20 },
      { name: 'Third', age: 30 }
    ];
    
    const generatedIds = [{ id: 100 }, { id: 200 }, { id: 300 }];
    const dbClient = mockDbClient(generatedIds);
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 5, 'orderTest');

    expect(req.body.rows).toEqual(inputRows);

    await entity.add(req, res, mockNext);

    expect(res.locals.rows[0]).toMatchObject({ name: 'First', age: 10, id: 100, consumerId: 5, consumerName: 'orderTest' });
    expect(res.locals.rows[1]).toMatchObject({ name: 'Second', age: 20, id: 200, consumerId: 5, consumerName: 'orderTest' });
    expect(res.locals.rows[2]).toMatchObject({ name: 'Third', age: 30, id: 300, consumerId: 5, consumerName: 'orderTest' });
  });
});
