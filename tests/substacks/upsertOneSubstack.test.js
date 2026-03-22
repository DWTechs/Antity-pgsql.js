import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("upsertOneSubstack", () => {
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
   * @param {object} row - Single row object to upsert
   * @param {string|string[]} conflictTarget - Conflict target column(s)
   * @returns {object} Mock request object
   */
  const mockRequest = (row, conflictTarget) => ({
    body: { row, conflictTarget },
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
   * Creates mock Express next function
   * 
   * @returns {function} Mock next function
   */
  const mockNext = () => jest.fn();

  it("should upsert a single row successfully with normalization and validation", async () => {
    const rowToUpsert = { id: 1, name: '  JOHN  ', email: '  JOHN@EXAMPLE.COM  ', age: 30 };
    const rowReturned = [{ id: 1 }];

    const dbClient = mockDbClient(rowReturned);
    const req = mockRequest(rowToUpsert, 'id');
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeOne, validateOne, upsert] = entity.upsertOneSubstack;

    // Execute middleware stack
    normalizeOne(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.rows[0].name).toBe('john');
    expect(req.body.rows[0].email).toBe('john@example.com');

    next.mockClear();
    validateOne(req, res, next);
    expect(next).toHaveBeenCalled();

    next.mockClear();
    await upsert(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.locals.rows).toHaveLength(1);
    expect(res.locals.rows[0].id).toBe(1);
  });

  it("should fail validation when required fields are missing", async () => {
    const rowToUpsert = { id: 1, email: 'john@example.com' }; // Missing name

    const dbClient = mockDbClient([]);
    const req = mockRequest(rowToUpsert, 'id');
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeOne, validateOne] = entity.upsertOneSubstack;

    normalizeOne(req, res, next);
    expect(next).toHaveBeenCalled();

    next.mockClear();
    validateOne(req, res, next);
    
    // Validation should fail and call next with an error
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.any(Number)
      })
    );
  });

  it("should fail validation when age is below minimum", async () => {
    const rowToUpsert = { id: 1, name: 'John', email: 'john@example.com', age: 15 }; // Age too low

    const dbClient = mockDbClient([]);
    const req = mockRequest(rowToUpsert, 'id');
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeOne, validateOne] = entity.upsertOneSubstack;

    normalizeOne(req, res, next);
    expect(next).toHaveBeenCalled();

    next.mockClear();
    validateOne(req, res, next);
    
    // Validation should fail and call next with an error
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.any(Number)
      })
    );
  });

  it("should handle upsert with email as conflict target", async () => {
    const rowToUpsert = { name: 'John', email: 'john@example.com', age: 30 };
    const rowReturned = [{ id: 1 }];

    const dbClient = mockDbClient(rowReturned);
    const req = mockRequest(rowToUpsert, 'email');
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeOne, validateOne, upsert] = entity.upsertOneSubstack;

    normalizeOne(req, res, next);
    validateOne(req, res, next);
    await upsert(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.locals.rows).toHaveLength(1);
    expect(res.locals.rows[0].id).toBe(1);
  });

  it("should fail when conflictTarget is missing", async () => {
    const rowToUpsert = { id: 1, name: 'John', email: 'john@example.com', age: 30 };

    const dbClient = mockDbClient([]);
    const req = mockRequest(rowToUpsert, undefined);
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [, , upsert] = entity.upsertOneSubstack;

    await upsert(req, res, next);
    
    // Should fail with error about missing conflictTarget
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        msg: "Missing conflictTarget for upsert operation"
      })
    );
  });
});
