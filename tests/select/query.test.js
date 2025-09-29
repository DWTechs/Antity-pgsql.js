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
  const entity2 = new SQLEntity('users', [{
      key: 'id',
      type: 'integer',
      min: 0,
      max: 120,
      typeCheck: true,
      methods: ['GET', 'PUT'],
      required: true,
      safe: true,
      sanitize: true,
      normalize: false,
      validate: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    }]);
  const entity3 = new SQLEntity('products', []);
  const entity4 = new SQLEntity('products', [
    {
      key: 'maxLevel',
      type: 'integer',
      min: 0,
      max: 120,
      typeCheck: true,
      methods: ['GET', 'PUT'],
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
      methods: ['GET', 'PUT'],
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
    const result = entity.query.select(false);
    expect(result).toBe("SELECT name, age FROM persons");
  });

  it("should generate a valid SQL SELECT query with given columns and table with pagination", () => {
    const result = entity2.query.select(true);
    expect(result).toBe("SELECT id, COUNT(*) OVER () AS total FROM users");
  });

  it("should generate a valid SQL SELECT query without columns", () => {
    const result = entity3.query.select(false);
    expect(result).toBe("SELECT * FROM products");
  });

  it("should generate a valid SQL SELECT query without columns with pagination", () => {
    const result = entity3.query.select(true);
    expect(result).toBe("SELECT *, COUNT(*) OVER () AS total FROM products");
  });

  it("should generate a valid SQL SELECT query without columns with pagination", () => {
    const result = entity3.query.select(true);
    expect(result).toBe("SELECT *, COUNT(*) OVER () AS total FROM products");
  });

  it("should generate a valid SQL SELECT query with uppercase property", () => {
    const result = entity4.query.select(false);
    expect(result).toBe("SELECT \"maxLevel\" FROM products");
  });

  it("should generate a valid SQL SELECT query with default property", () => {
    const result = entity5.query.select(false);
    expect(result).toBe("SELECT \"default\" FROM products");
  });

});