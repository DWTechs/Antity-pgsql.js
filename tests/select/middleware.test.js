import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("get middleware", () => {
  const entity = new SQLEntity('persons', [
    {
      key: 'id',
      type: 'integer',
      min: 1,
      max: 999999999,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: [],
      operations: ['SELECT'],
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
   * Creates a mock database client that returns the given rows.
   *
   * @param {object[]} rows - Rows to return from the query.
   * @returns {object} Mock client object.
   */
  const mockDbClient = (rows) => ({
    query: jest.fn().mockResolvedValue({
      rows,
      rowCount: rows.length
    })
  });

  /**
   * Creates a mock Express request object.
   *
   * @param {object} [body={}] - Request body options (first, rows, sortField, sortOrder, filters, pagination).
   * @returns {object} Mock request object.
   */
  const mockRequest = (body = {}) => ({ body });

  /**
   * Creates a mock Express response object.
   *
   * @param {object|null} dbClient - Database client.
   * @returns {object} Mock response object.
   */
  const mockResponse = (dbClient) => ({
    locals: { dbClient }
  });

  /** @type {jest.Mock} */
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should execute SELECT query and call next() without error", async () => {
    const rows = [{ id: 1, name: 'John', age: 30 }];
    const dbClient = mockDbClient(rows);
    const res = mockResponse(dbClient);

    entity.get(mockRequest(), res, mockNext);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should set res.locals.rows from the query result", async () => {
    const rows = [
      { id: 1, name: 'Alice', age: 28 },
      { id: 2, name: 'Bob', age: 35 }
    ];
    const dbClient = mockDbClient(rows);
    const res = mockResponse(dbClient);

    entity.get(mockRequest(), res, mockNext);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(res.locals.rows).toEqual(rows);
  });

  it("should apply sortOrder DESC when sortOrder is -1", async () => {
    const dbClient = mockDbClient([{ id: 1, name: 'John', age: 30 }]);
    const res = mockResponse(dbClient);

    entity.get(mockRequest({ sortField: 'name', sortOrder: -1 }), res, mockNext);
    await new Promise(resolve => setTimeout(resolve, 0));

    const [sql] = dbClient.query.mock.calls[0];
    expect(sql).toContain('DESC');
  });

  it("should apply sortOrder DESC when sortOrder is 'DESC'", async () => {
    const dbClient = mockDbClient([{ id: 1, name: 'John', age: 30 }]);
    const res = mockResponse(dbClient);

    entity.get(mockRequest({ sortField: 'name', sortOrder: 'DESC' }), res, mockNext);
    await new Promise(resolve => setTimeout(resolve, 0));

    const [sql] = dbClient.query.mock.calls[0];
    expect(sql).toContain('DESC');
  });

  it("should apply LIMIT and OFFSET when rows and first are provided", async () => {
    const dbClient = mockDbClient([{ id: 1, name: 'John', age: 30 }]);
    const res = mockResponse(dbClient);

    entity.get(mockRequest({ first: 10, rows: 5 }), res, mockNext);
    await new Promise(resolve => setTimeout(resolve, 0));

    const [sql] = dbClient.query.mock.calls[0];
    expect(sql).toContain('LIMIT');
    expect(sql).toContain('OFFSET');
  });

  it("should call next with 404 when no rows are found", async () => {
    const dbClient = mockDbClient([]);
    const res = mockResponse(dbClient);

    entity.get(mockRequest(), res, mockNext);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
  });

  it("should call next(error) when the database operation fails", async () => {
    const dbError = new Error('Database connection failed');
    const dbClient = { query: jest.fn().mockRejectedValue(dbError) };
    const res = mockResponse(dbClient);

    entity.get(mockRequest(), res, mockNext);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });
});
