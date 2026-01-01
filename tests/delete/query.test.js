import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("query function", () => {
  const entity = new SQLEntity('persons', [
    {
      key: 'name',
      type: 'string',
      min: 1,
      max: 255,
      typeCheck: true,
      filter: true,
      methods: ['GET', 'POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      required: true,
      safe: true,
      sanitize: true,
      normalize: true,
      validate: true,
      sanitizer: null,
      normalizer: val => val.toLowerCase(),
      validator: null
    },
    {
      key: 'age',
      type: 'integer',
      min: 0,
      max: 120,
      typeCheck: true,
      filter: true,
      methods: ['GET', 'PUT'],
      operations: ['SELECT', 'UPDATE'],
      required: true,
      safe: true,
      sanitize: true,
      normalize: false,
      validate: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    }
  ]);

  describe("delete by ID", () => {
    it("should generate a valid SQL DELETE query with given IDs", () => {
      const result = entity.query.delete([1, 2, 3]);
      expect(result.query).toBe("DELETE FROM persons WHERE id = ANY($1)");
      expect(result.args).toEqual([[1, 2, 3]]);
    });

    it("should generate a valid SQL DELETE query with a single ID", () => {
      const result = entity.query.delete([42]);
      expect(result.query).toBe("DELETE FROM persons WHERE id = ANY($1)");
      expect(result.args).toEqual([[42]]);
    });

    it("should generate a valid SQL DELETE query with multiple IDs", () => {
      const result = entity.query.delete([1, 5, 10, 15, 20]);
      expect(result.query).toBe("DELETE FROM persons WHERE id = ANY($1)");
      expect(result.args).toEqual([[1, 5, 10, 15, 20]]);
    });

    it("should generate a valid SQL DELETE query with empty array", () => {
      const result = entity.query.delete([]);
      expect(result.query).toBe("DELETE FROM persons WHERE id = ANY($1)");
      expect(result.args).toEqual([[]]);
    });
  });

  describe("deleteArchive", () => {
    it("should generate a valid SQL DELETE query for archived rows", () => {
      const result = entity.query.deleteArchive();
      expect(result).toBe("DELETE FROM persons WHERE \"archivedAt\" < $1");
    });

    it("should generate the same query regardless of repeated calls", () => {
      const result1 = entity.query.deleteArchive();
      const result2 = entity.query.deleteArchive();
      expect(result1).toBe(result2);
      expect(result1).toBe("DELETE FROM persons WHERE \"archivedAt\" < $1");
    });
  });

});