import { SQLEntity } from "../../dist/antity-pgsql.js";

describe("getCache", () => {
  const entity = new SQLEntity("persons", [
    {
      key: "id",
      type: "integer",
      min: 1,
      max: 999999999,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: [],
      operations: ["SELECT"],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null,
    },
    {
      key: "name",
      type: "string",
      min: 1,
      max: 255,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: ["POST"],
      operations: ["SELECT", "INSERT"],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null,
    },
    {
      key: "archived",
      type: "boolean",
      min: null,
      max: null,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: [],
      operations: ["SELECT"],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null,
    },
  ]);

  const mockDbClient = (rows) => ({
    query: jest.fn().mockResolvedValue({
      rows,
      rowCount: rows.length,
    }),
  });

  it("should always exclude archived rows", async () => {
    const dbClient = mockDbClient([{ id: 1, name: "a", archived: false }]);

    await entity.getCache(null, dbClient);

    const [sql] = dbClient.query.mock.calls[0];
    expect(sql).toContain("WHERE archived IS FALSE");
    expect(sql).toContain("ORDER BY id ASC");
    expect(sql).not.toContain("LIMIT");
  });

  it("should merge caller filters with the archived exclusion", async () => {
    const dbClient = mockDbClient([]);

    await entity.getCache(
      { name: { value: "a", matchMode: "equals" } },
      dbClient,
    );

    const [sql, args] = dbClient.query.mock.calls[0];
    expect(sql).toContain("archived IS FALSE");
    expect(sql).toContain("name");
    expect(args).toEqual(["a"]);
  });

  it("should overwrite a caller-supplied archived filter", async () => {
    // Soft-deleted rows must never enter a cache, even if the caller asks.
    const dbClient = mockDbClient([]);

    await entity.getCache(
      { archived: { value: true, matchMode: "IS" } },
      dbClient,
    );

    const [sql] = dbClient.query.mock.calls[0];
    expect(sql).toContain("archived IS FALSE");
    expect(sql).not.toContain("archived IS TRUE");
  });

  it("should return an empty array when nothing matches, not a 404", async () => {
    const dbClient = mockDbClient([]);

    await expect(entity.getCache(null, dbClient)).resolves.toEqual([]);
  });

  it("should throw when the entity has no archived property", () => {
    const bare = new SQLEntity("things", [
      {
        key: "id",
        type: "integer",
        min: 1,
        max: 9,
        isTypeChecked: true,
        isFilterable: true,
        requiredFor: [],
        operations: ["SELECT"],
        isPrivate: false,
        sanitizer: null,
        normalizer: null,
        validator: null,
      },
    ]);

    expect(() => bare.getCache()).toThrow(/archived/);
  });

  it("should propagate database errors", async () => {
    const dbClient = {
      query: jest.fn().mockRejectedValue(new Error("connection refused")),
    };

    await expect(entity.getCache(null, dbClient)).rejects.toThrow(
      "connection refused",
    );
  });
});
