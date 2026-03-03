import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("updateOneSubstack", () => {
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

  const mockRequest = (body) => ({
    body
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
    const substack = entity.updateOneSubstack;
    
    expect(Array.isArray(substack)).toBe(true);
    expect(substack).toHaveLength(3);
    expect(typeof substack[0]).toBe('function');
    expect(typeof substack[1]).toBe('function');
    expect(typeof substack[2]).toBe('function');
  });

  it("should contain normalizeOne, validateOne, and update in order", () => {
    const substack = entity.updateOneSubstack;
    
    expect(substack[0]).toBe(entity.normalizeOne);
    expect(substack[1]).toBe(entity.validateOne);
    expect(substack[2]).toBe(entity.update);
  });

  it("should normalize, validate, and update a single object when all middleware are called sequentially", async () => {
    const inputData = { id: 1, name: '  JOHN UPDATED  ', email: '  JOHNUPDATED@EXAMPLE.COM  ', age: 31 };
    
    const dbClient = mockDbClient();
    const req = mockRequest(inputData);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    const [normalize, validate, update] = entity.updateOneSubstack;

    // Execute the middleware chain
    normalize(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();

    // Verify normalization occurred and data is in rows array
    expect(req.body.rows).toBeDefined();
    expect(req.body.rows).toHaveLength(1);
    expect(req.body.rows[0].name).toBe('john updated');
    expect(req.body.rows[0].email).toBe('johnupdated@example.com');

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
});
