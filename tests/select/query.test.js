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
  const entity2 = new SQLEntity('users', [
    {
      key: 'id',
      type: 'integer',
      min: 0,
      max: 120,
      typeCheck: true,
      filter: true,
      methods: ['GET', 'PUT'],
      operations: ['SELECT'],
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
  const entity3 = new SQLEntity('products', []);
  const entity4 = new SQLEntity('products', [
    {
      key: 'maxLevel',
      type: 'integer',
      min: 0,
      max: 120,
      typeCheck: true,
      filter: true,
      methods: ['GET', 'PUT'],
      operations: ['SELECT'],
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
  const entity5 = new SQLEntity('products', [
    {
      key: 'default',
      type: 'integer',
      min: 0,
      max: 120,
      typeCheck: true,
      filter: true,
      methods: ['GET', 'PUT'],
      operations: ['SELECT'],
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
  it("should generate a valid SQL SELECT query with given columns and table", () => {
    const result = entity.query.select();
    expect(result.query).toBe("SELECT name, age FROM persons");
    expect(result.args).toEqual([]);
  });

  it("should generate a valid SQL SELECT query with given columns and table with pagination", () => {
    const result = entity2.query.select(0,10);
    expect(result.query).toBe("SELECT id, COUNT(*) OVER () AS total FROM users LIMIT 10 OFFSET 0");
    expect(result.args).toEqual([]);
  });

  it("should generate a valid SQL SELECT query without columns", () => {
    const result = entity3.query.select();
    expect(result.query).toBe("SELECT * FROM products");
    expect(result.args).toEqual([]);
  });

  it("should generate a valid SQL SELECT query without columns with pagination", () => {
    const result = entity3.query.select(0, 10);
    expect(result.query).toBe("SELECT *, COUNT(*) OVER () AS total FROM products LIMIT 10 OFFSET 0");
    expect(result.args).toEqual([]);
  });

  it("should generate a valid SQL SELECT query with uppercase property", () => {
    const result = entity4.query.select();
    expect(result.query).toBe("SELECT \"maxLevel\" FROM products");
    expect(result.args).toEqual([]);
  });

  it("should generate a valid SQL SELECT query with default property", () => {
    const result = entity5.query.select();
    expect(result.query).toBe("SELECT \"default\" FROM products");
    expect(result.args).toEqual([]);
  });

  it("should generate a valid SQL SELECT query with filtering parameters", () => {
    const filters = {
      name: { value: 'John', matchMode: 'equals' }
    };
    const result = entity.query.select(0, 10, 'name', 'ASC', filters);
    expect(result.query).toContain("SELECT name, age, COUNT(*) OVER () AS total FROM persons WHERE");
    expect(result.query).toContain("ORDER BY");
    expect(result.query).toContain("LIMIT");
    expect(Array.isArray(result.args)).toBe(true);
  });

  it("should generate a valid SQL SELECT query with sorting only", () => {
    const result = entity.query.select(0, 0, 'age', 'DESC');
    expect(result.query).toBe("SELECT name, age FROM persons ORDER BY age DESC");
    expect(result.args).toEqual([]);
  });

  it("should generate a valid SQL SELECT query with pagination only", () => {
    const result = entity.query.select(5, 15);
    expect(result.query).toBe("SELECT name, age, COUNT(*) OVER () AS total FROM persons LIMIT 15 OFFSET 5");
    expect(result.args).toEqual([]);
  });

});