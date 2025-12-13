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
      methods: ['GET', 'POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
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
  const entity2 = new SQLEntity('persons', [
    {
      key: 'name',
      type: 'string',
      min: 1,
      max: 255,
      typeCheck: true,
      methods: ['GET', 'PUT'],
      operations: ['SELECT', 'UPDATE'],
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
      methods: ['GET', 'POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
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

  it("should generate a valid SQL INSERT query with name and age props and return Id", () => {
    const chunk = [
      { name: 'John', age: 30 },
      { name: 'Henry', age: 40 },
    ];
    const consumerId = 1;
    const consumerName = 'consumer';
    const rtn = entity.query.return("id");
    const { query, args } = entity.query.insert(chunk, consumerId, consumerName, rtn);
    expect(query).toBe(
      'INSERT INTO persons (name, age, consumerId, consumerName) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8) RETURNING "id"'
    );
    expect(args).toEqual([
      'John', 30, 1, 'consumer',
      'Henry', 40, 1, 'consumer'
    ]);
  });

  it("should generate a valid SQL INSERT query with name and age props and return nothing", () => {
    const chunk = [
      { name: 'John', age: 30 },
      { name: 'Henry', age: 40 },
    ];
    const consumerId = 1;
    const consumerName = 'consumer';
    const rtn = "";
    const { query, args } = entity.query.insert(chunk, consumerId, consumerName, rtn);
    expect(query).toBe(
      'INSERT INTO persons (name, age, consumerId, consumerName) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)'
    );
    expect(args).toEqual([
      'John', 30, 1, 'consumer',
      'Henry', 40, 1, 'consumer'
    ]);
  });

  it("should generate a valid SQL INSERT query with age prop and return Id", () => {
    const chunk = [
      { name: 'John', age: 30 },
      { name: 'Henry', age: 40 },
    ];
    const consumerId = 1;
    const consumerName = 'consumer';
    const rtn = entity2.query.return("id");
    const { query, args } = entity2.query.insert(chunk, consumerId, consumerName, rtn);
    expect(query).toBe(
      'INSERT INTO persons (age, consumerId, consumerName) VALUES ($1, $2, $3), ($4, $5, $6) RETURNING "id"'
    );
    expect(args).toEqual([
      30, consumerId, consumerName,
      40, consumerId, consumerName
    ]);
  });

  it("should generate a valid SQL INSERT query without consumerId and consumerName", () => {
    const chunk = [
      { name: 'John', age: 30 },
      { name: 'Henry', age: 40 },
    ];
    const rtn = entity.query.return("id");
    const { query, args } = entity.query.insert(chunk, undefined, undefined, rtn);
    expect(query).toBe(
      'INSERT INTO persons (name, age) VALUES ($1, $2), ($3, $4) RETURNING "id"'
    );
    expect(args).toEqual([
      'John', 30,
      'Henry', 40
    ]);
  });

  it("should generate a valid SQL INSERT query without consumerId and consumerName and no return", () => {
    const chunk = [
      { name: 'John', age: 30 },
      { name: 'Henry', age: 40 },
    ];
    const { query, args } = entity.query.insert(chunk);
    expect(query).toBe(
      'INSERT INTO persons (name, age) VALUES ($1, $2), ($3, $4)'
    );
    expect(args).toEqual([
      'John', 30,
      'Henry', 40
    ]);
  });

});