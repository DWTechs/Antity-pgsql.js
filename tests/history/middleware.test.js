import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("getHistory middleware", () => {
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
    }
  ]);

  const mockDbClient = (result) => ({
    query: jest.fn().mockResolvedValue(result)
  });

  const mockRequest = (id) => ({ params: { id } });

  const mockResponse = (dbClient) => ({
    locals: { dbClient }
  });

  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call next with 400 when req.params.id is missing", () => {
    const res = mockResponse(mockDbClient({ rows: [], rowCount: 0 }));

    entity.getHistory(mockRequest(undefined), res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ status: 400, message: "Missing id" }));
  });

  it("should call next with 404 when no history rows are found", async () => {
    const dbClient = mockDbClient({ rows: [], rowCount: 0 });
    const res = mockResponse(dbClient);

    entity.getHistory(mockRequest(1), res, mockNext);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ status: 404, message: "History not found" }));
  });

  it("should set res.locals.history and res.locals.total on success", async () => {
    const rows = [
      { id: 1, tstamp: '2024-01-01', operation: 'INSERT', consumerId: 1, consumerName: 'admin' },
      { id: 2, tstamp: '2024-01-02', operation: 'UPDATE', consumerId: 1, consumerName: 'admin' },
    ];
    const dbClient = mockDbClient({ rows, rowCount: rows.length });
    const res = mockResponse(dbClient);

    entity.getHistory(mockRequest(1), res, mockNext);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(res.locals.history).toEqual(rows);
    expect(res.locals.total).toBe(2);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next(error) when the database operation fails", async () => {
    const dbError = new Error('Database connection failed');
    const dbClient = { query: jest.fn().mockRejectedValue(dbError) };
    const res = mockResponse(dbClient);

    entity.getHistory(mockRequest(1), res, mockNext);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockNext).toHaveBeenCalledWith(dbError);
  });
});
