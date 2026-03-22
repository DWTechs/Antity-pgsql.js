import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("upsertArraySubstack", () => {
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
   * @param {object[]} rows - Array of row objects to upsert
   * @param {string|string[]} conflictTarget - Conflict target column(s)
   * @returns {object} Mock request object
   */
  const mockRequest = (rows, conflictTarget) => ({
    body: { rows, conflictTarget },
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

  it("should upsert multiple rows successfully with normalization and validation", async () => {
    const rowsToUpsert = [
      { id: 1, name: '  JOHN  ', email: '  JOHN@EXAMPLE.COM  ', age: 30 },
      { id: 2, name: '  JANE  ', email: '  JANE@EXAMPLE.COM  ', age: 25 }
    ];
    
    const rowsReturned = [
      { id: 1 },
      { id: 2 }
    ];

    const dbClient = mockDbClient(rowsReturned);
    const req = mockRequest(rowsToUpsert, 'id');
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeArray, validateArray, upsert] = entity.upsertArraySubstack;

    // Execute middleware stack
    normalizeArray(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.rows[0].name).toBe('john');
    expect(req.body.rows[0].email).toBe('john@example.com');
    expect(req.body.rows[1].name).toBe('jane');
    expect(req.body.rows[1].email).toBe('jane@example.com');

    next.mockClear();
    validateArray(req, res, next);
    expect(next).toHaveBeenCalled();

    next.mockClear();
    await upsert(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.locals.rows).toHaveLength(2);
    expect(res.locals.rows[0].id).toBe(1);
    expect(res.locals.rows[1].id).toBe(2);
  });

  it("should fail validation when required fields are missing", async () => {
    const rowsToUpsert = [
      { id: 1, email: 'john@example.com' } // Missing name
    ];

    const dbClient = mockDbClient([]);
    const req = mockRequest(rowsToUpsert, 'id');
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeArray, validateArray] = entity.upsertArraySubstack;

    normalizeArray(req, res, next);
    expect(next).toHaveBeenCalled();

    next.mockClear();
    validateArray(req, res, next);
    
    // Validation should fail and call next with an error
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: expect.any(Number),
        message: expect.any(String)
      })
    );
  });

  it("should fail validation when age is below minimum", async () => {
    const rowsToUpsert = [
      { id: 1, name: 'John', email: 'john@example.com', age: 15 } // Age too low
    ];

    const dbClient = mockDbClient([]);
    const req = mockRequest(rowsToUpsert, 'id');
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeArray, validateArray] = entity.upsertArraySubstack;

    normalizeArray(req, res, next);
    expect(next).toHaveBeenCalled();

    next.mockClear();
    validateArray(req, res, next);
    
    // Validation should fail and call next with an error
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: expect.any(Number),
        message: expect.any(String)
      })
    );
  });

  it("should handle upsert with email as conflict target", async () => {
    const rowsToUpsert = [
      { name: 'John', email: 'john@example.com', age: 30 }
    ];
    
    const rowsReturned = [
      { id: 1 }
    ];

    const dbClient = mockDbClient(rowsReturned);
    const req = mockRequest(rowsToUpsert, 'email');
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [normalizeArray, validateArray, upsert] = entity.upsertArraySubstack;

    normalizeArray(req, res, next);
    validateArray(req, res, next);
    await upsert(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.locals.rows).toHaveLength(1);
    expect(res.locals.rows[0].id).toBe(1);
  });

  it("should fail when conflictTarget is missing", async () => {
    const rowsToUpsert = [
      { id: 1, name: 'John', email: 'john@example.com', age: 30 }
    ];

    const dbClient = mockDbClient([]);
    const req = mockRequest(rowsToUpsert, undefined);
    const res = mockResponse(dbClient, 1, 'admin');
    const next = mockNext();

    const [, , upsert] = entity.upsertArraySubstack;

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
