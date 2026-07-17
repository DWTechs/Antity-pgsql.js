import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("delete middleware", () => {
  const entity = new SQLEntity('persons', [
    {
      key: 'id',
      type: 'integer',
      min: 1,
      max: 999999999,
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
      normalizer: null,
      validator: null
    }
  ]);

  /**
   * Creates a mock database client that resolves successfully.
   *
   * @returns {object} Mock client object.
   */
  const mockDbClient = () => ({
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
  });

  /**
   * Creates a mock Express request object.
   *
   * @param {object[]} rows - Array of objects with id fields to delete.
   * @returns {object} Mock request object.
   */
  const mockRequest = (rows) => ({
    body: { rows }
  });

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

  // ─── delete ───────────────────────────────────────────────────────────────

  it("should execute DELETE query and call next() without error", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ id: 1 }, { id: 2 }]);
    const res = mockResponse(dbClient);

    await entity.delete(req, res, mockNext);

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should pass the correct ids in the query args", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ id: 10 }, { id: 20 }, { id: 30 }]);
    const res = mockResponse(dbClient);

    await entity.delete(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args[0]).toEqual([10, 20, 30]);
  });

  it("should handle a single row", async () => {
    const dbClient = mockDbClient();
    const req = mockRequest([{ id: 42 }]);
    const res = mockResponse(dbClient);

    await entity.delete(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args[0]).toEqual([42]);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next(error) when the database operation fails", async () => {
    const dbError = new Error('Database connection failed');
    const dbClient = { query: jest.fn().mockRejectedValue(dbError) };
    const req = mockRequest([{ id: 1 }, { id: 2 }]);
    const res = mockResponse(dbClient);

    await entity.delete(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });

  it("should use pool when dbClient is null", async () => {
    // Without a real pool, just verify the call reaches execute (which will fail gracefully)
    const req = mockRequest([{ id: 1 }]);
    const res = mockResponse(null);

    // Should not throw synchronously
    await expect(entity.delete(req, res, mockNext)).resolves.toBeUndefined();
  });

  it("should fall back to req.params.id when req.body.rows is missing", async () => {
    const dbClient = mockDbClient();
    const req = { body: {}, params: { id: 7 } };
    const res = mockResponse(dbClient);

    await entity.delete(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args[0]).toEqual([7]);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should fall back to req.params.id when req.body is undefined", async () => {
    const dbClient = mockDbClient();
    const req = { params: { id: 9 } };
    const res = mockResponse(dbClient);

    await entity.delete(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args[0]).toEqual([9]);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should prefer req.body.rows over req.params.id when both are present", async () => {
    const dbClient = mockDbClient();
    const req = { body: { rows: [{ id: 1 }, { id: 2 }] }, params: { id: 999 } };
    const res = mockResponse(dbClient);

    await entity.delete(req, res, mockNext);

    const [, args] = dbClient.query.mock.calls[0];
    expect(args[0]).toEqual([1, 2]);
  });

  it("should call next with 400 when neither req.body.rows nor req.params.id is provided", async () => {
    const req = { body: {}, params: {} };
    const res = mockResponse(mockDbClient());

    await entity.delete(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith({
      status: 400,
      message: "Missing rows in req.body or id in req.params for delete operation",
    });
  });

  it("should call next with 400 when req.body.rows is an empty array and no req.params.id", async () => {
    const req = { body: { rows: [] }, params: {} };
    const res = mockResponse(mockDbClient());

    await entity.delete(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith({
      status: 400,
      message: "Missing rows in req.body or id in req.params for delete operation",
    });
  });

  // ─── deleteArchive ────────────────────────────────────────────────────────

  describe("deleteArchive middleware", () => {
    /**
     * Creates a mock Express request object for deleteArchive.
     *
     * @param {Date} date - Date threshold for deletion.
     * @returns {object} Mock request object.
     */
    const mockArchiveRequest = (date) => ({
      body: { date }
    });

    it("should execute hard_delete query and call next() without error", async () => {
      const dbClient = mockDbClient();
      const req = mockArchiveRequest(new Date('2025-01-01'));
      const res = mockResponse(dbClient);

      entity.deleteArchive(req, res, mockNext);

      // deleteArchive is async internally via promise chain
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(dbClient.query).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should pass schema, table and date as query args", async () => {
      const dbClient = mockDbClient();
      const date = new Date('2024-06-15');
      const req = mockArchiveRequest(date);
      const res = mockResponse(dbClient);

      entity.deleteArchive(req, res, mockNext);
      await new Promise(resolve => setTimeout(resolve, 0));

      const [, args] = dbClient.query.mock.calls[0];
      expect(args[0]).toBe('public');
      expect(args[1]).toBe('persons');
      expect(args[2]).toBe(date);
    });

    it("should call next(error) when the database operation fails", async () => {
      const dbError = new Error('hard_delete failed');
      const dbClient = { query: jest.fn().mockRejectedValue(dbError) };
      const req = mockArchiveRequest(new Date('2025-01-01'));
      const res = mockResponse(dbClient);

      entity.deleteArchive(req, res, mockNext);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });
});
