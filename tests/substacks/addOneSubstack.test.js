import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("addOneSubstack", () => {
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

  const mockDbClient = (rowsToReturn) => ({
    query: jest.fn().mockResolvedValue({
      rows: rowsToReturn,
      rowCount: rowsToReturn.length
    })
  });

  const mockRequest = (body) => ({
    body,
    method: 'POST'
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
    const substack = entity.addOneSubstack;
    
    expect(Array.isArray(substack)).toBe(true);
    expect(substack).toHaveLength(3);
    expect(typeof substack[0]).toBe('function');
    expect(typeof substack[1]).toBe('function');
    expect(typeof substack[2]).toBe('function');
  });

  it("should contain normalizeOne, validateOne, and add in order", () => {
    const substack = entity.addOneSubstack;
    
    expect(substack[0]).toBe(entity.normalizeOne);
    expect(substack[1]).toBe(entity.validateOne);
    expect(substack[2]).toBe(entity.add);
  });

  it("should normalize, validate, and add a single object when all middleware are called sequentially", async () => {
    const inputData = { name: '  JOHN  ', email: '  JOHN@EXAMPLE.COM  ', age: 30 };
    
    const generatedIds = [{ id: 1 }];
    const dbClient = mockDbClient(generatedIds);
    const req = mockRequest(inputData);
    const res = mockResponse(dbClient, 1, 'testConsumer');

    const [normalize, validate, add] = entity.addOneSubstack;

    // Execute the middleware chain
    normalize(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();

    // Verify normalization occurred on req.body directly
    expect(req.body.name).toBe('john');
    expect(req.body.email).toBe('john@example.com');
    expect(req.body.age).toBe(30);

    mockNext.mockClear();

    // Validate
    validate(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();

    mockNext.mockClear();

    // Convert to array format expected by add middleware
    req.body = { rows: [req.body] };

    // Add to database
    await add(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();

    // Verify row was added with ID
    expect(res.locals.rows).toHaveLength(1);
    expect(res.locals.rows[0]).toMatchObject({
      name: 'john',
      email: 'john@example.com',
      age: 30,
      id: 1
    });
  });
});
