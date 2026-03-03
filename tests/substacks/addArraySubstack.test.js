import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("addArraySubstack", () => {
  const entity = new SQLEntity('users', [
    {
      key: 'id',
      type: 'integer',
      min: 1,
      max: 999999999,
      typeCheck: true,
      filter: true,
      need: ['PUT'],
      operations: ['SELECT', 'UPDATE', 'DELETE'],
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
      sanitizer: null,
      normalizer: val => val.trim().toLowerCase(),
      validator: null
    },
    {
      key: 'email',
      type: 'email',
      min: 5,
      max: 255,
      typeCheck: true,
      filter: true,
      need: ['POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      send: true,
      sanitizer: null,
      normalizer: val => val.trim().toLowerCase(),
      validator: null
    },
    {
      key: 'age',
      type: 'integer',
      min: 18,
      max: 120,
      typeCheck: true,
      filter: true,
      need: ['POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      send: true,
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
    body: { rows },
    method: 'POST'
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

  it("should return an array of three middleware functions", () => {
    const substack = entity.addArraySubstack;
    
    expect(Array.isArray(substack)).toBe(true);
    expect(substack).toHaveLength(3);
    expect(typeof substack[0]).toBe('function');
    expect(typeof substack[1]).toBe('function');
    expect(typeof substack[2]).toBe('function');
  });

  it("should contain normalizeArray, validateArray, and add in order", () => {
    const substack = entity.addArraySubstack;
    
    expect(substack[0]).toBe(entity.normalizeArray);
    expect(substack[1]).toBe(entity.validateArray);
    expect(substack[2]).toBe(entity.add);
  });

  it("should normalize, validate, and add data when all middleware are called sequentially", async () => {
    const inputRows = [
      { name: '  JOHN  ', email: '  JOHN@EXAMPLE.COM  ', age: 30 },
      { name: '  JANE  ', email: '  JANE@TEST.COM  ', age: 25 }
    ];
    
    const generatedIds = [{ id: 1 }, { id: 2 }];
    const dbClient = mockDbClient(generatedIds);
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    const [normalize, validate, add] = entity.addArraySubstack;

    // Execute the middleware chain
    normalize(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();

    // Verify normalization occurred
    expect(req.body.rows[0].name).toBe('john');
    expect(req.body.rows[0].email).toBe('john@example.com');
    expect(req.body.rows[1].name).toBe('jane');
    expect(req.body.rows[1].email).toBe('jane@test.com');

    mockNext.mockClear();

    // Validate
    validate(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();

    mockNext.mockClear();

    // Add to database
    await add(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();

    // Verify rows were added with IDs
    expect(res.locals.rows).toHaveLength(2);
    expect(res.locals.rows[0]).toMatchObject({
      name: 'john',
      email: 'john@example.com',
      age: 30,
      id: 1
    });
    expect(res.locals.rows[1]).toMatchObject({
      name: 'jane',
      email: 'jane@test.com',
      age: 25,
      id: 2
    });
  });

  it("should handle validation errors in the chain", () => {
    const inputRows = [
      { name: '  JOHN  ', email: '  JOHN@EXAMPLE.COM  ', age: 15 } // age is below minimum
    ];
    
    const req = mockRequest(inputRows);
    const res = mockResponse(null, 1, 'testConsumer');

    const [normalize, validate] = entity.addArraySubstack;

    // Normalize
    normalize(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
    mockNext.mockClear();

    // Validate - should fail due to age < 18
    validate(req, res, mockNext);
    
    // Next should be called with an error
    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
    expect(error.message).toBeDefined();
  });

  it("should be usable in Express.js route definitions", async () => {
    // Simulate Express route: app.post('/users', ...entity.addArraySubstack)
    const inputRows = [
      { name: 'Alice', email: 'alice@example.com', age: 28 }
    ];
    
    const generatedIds = [{ id: 42 }];
    const dbClient = mockDbClient(generatedIds);
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testApp');

    // Spread operator syntax as used in Express routes
    const middlewares = [...entity.addArraySubstack];
    
    expect(middlewares).toHaveLength(3);

    // Execute all middlewares
    for (const middleware of middlewares) {
      await middleware(req, res, mockNext);
    }

    expect(mockNext).toHaveBeenCalledTimes(3);
    expect(res.locals.rows).toHaveLength(1);
    expect(res.locals.rows[0].id).toBe(42);
  });
});
