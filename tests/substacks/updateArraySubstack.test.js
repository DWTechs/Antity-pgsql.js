import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("updateArraySubstack", () => {
  const entity = new SQLEntity('users', [
    {
      key: 'id',
      type: 'integer',
      min: 1,
      max: 0,
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

  const mockDbClient = () => ({
    query: jest.fn().mockResolvedValue({
      rows: [],
      rowCount: 0
    })
  });

  const mockRequest = (rows) => ({
    body: { rows }
  });

  const mockResponse = (dbClient, consumerId, consumerName) => ({
    locals: {
      dbClient,
      consumerId,
      consumerName,
      rows: []
    }
  });

  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an array of three middleware functions", () => {
    const substack = entity.updateArraySubstack;
    
    expect(Array.isArray(substack)).toBe(true);
    expect(substack).toHaveLength(3);
    expect(typeof substack[0]).toBe('function');
    expect(typeof substack[1]).toBe('function');
    expect(typeof substack[2]).toBe('function');
  });

  it("should contain normalizeArray, validateArray, and update in order", () => {
    const substack = entity.updateArraySubstack;
    
    expect(substack[0]).toBe(entity.normalizeArray);
    expect(substack[1]).toBe(entity.validateArray);
    expect(substack[2]).toBe(entity.update);
  });

  it("should normalize, validate, and update data when all middleware are called sequentially", async () => {
    const inputRows = [
      { id: 1, name: '  JOHN UPDATED  ', email: '  JOHNUPDATED@EXAMPLE.COM  ', age: 31 },
      { id: 2, name: '  JANE UPDATED  ', email: '  JANEUPDATED@TEST.COM  ', age: 26 }
    ];
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputRows);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    const [normalize, validate, update] = entity.updateArraySubstack;

    // Execute the middleware chain
    normalize(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();

    // Verify normalization occurred
    expect(req.body.rows[0].name).toBe('john updated');
    expect(req.body.rows[0].email).toBe('johnupdated@example.com');
    expect(req.body.rows[1].name).toBe('jane updated');
    expect(req.body.rows[1].email).toBe('janeupdated@test.com');

    mockNext.mockClear();

    // Validate
    validate(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();

    mockNext.mockClear();

    // Update in database
    await update(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();

    // Verify database query was called
    expect(dbClient.query).toHaveBeenCalled();
  });

  it("should handle validation errors in the update chain", () => {
    const inputRows = [
      { id: 1, name: '  JOHN  ', email: '  JOHN@EXAMPLE.COM  ', age: 15 } // age is below minimum
    ];
    
    const req = mockRequest(inputRows);
    const res = mockResponse(null, 1, 'testConsumer');

    const [normalize, validate] = entity.updateArraySubstack;

    // Normalize
    normalize(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
    mockNext.mockClear();

    // Validate - should fail due to age < 18
    validate(req, res, mockNext);
    
    // Next should be called with an error
    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
  });
});
