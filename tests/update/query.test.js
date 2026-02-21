import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("query function", () => {
  
  const consumerEntity = new SQLEntity("consumer", [
    {
      key: "id",
      type: "integer",
      min: 0,
      max: 999999999,
      typeCheck: true,
      filter: true,
      methods: ["GET", "POST"],
      operations: ["SELECT"],
      required: false,
      safe: false,
      sanitize: true,
      normalize: false,
      validate: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
    {
      key: "nickname",
      type: "string",
      min: 3,
      max: 30,
      typeCheck: true,
      filter: true,
      methods: ["GET", "POST"],
      operations: ["SELECT", "INSERT"],
      required: true,
      safe: true,
      sanitize: true,
      normalize: false,
      validate: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
    {
      key: "accessToken",
      type: "jwt",
      min: 28,
      max: 8000,
      typeCheck: true,
      filter: false,
      methods: ["GET", "POST"],
      operations: ["SELECT", "INSERT", "UPDATE"],
      required: true,
      safe: true,
      sanitize: true,
      normalize: false,
      validate: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
    {
      key: "refreshToken",
      type: "jwt",
      min: 28,
      max: 8000,
      typeCheck: true,
      filter: false,
      methods: ["GET", "POST", "PUT"],
      operations: ["SELECT", "INSERT", "UPDATE"],
      required: true,
      safe: true,
      sanitize: true,
      normalize: false,
      validate: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
    {
      key: "rolesArrayAgg",
      type: "array",
      min: 0,
      max: 100,
      typeCheck: true,
      filter: true,
      methods: ["GET", "POST"],
      operations: ["SELECT", "INSERT"],
      required: true,
      safe: true,
      sanitize: true,
      normalize: false,
      validate: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
  ]);

  
  const entity = new SQLEntity('persons', [
    {
      key: 'id',
      type: 'number',
      min: 1,
      max: 255,
      typeCheck: true,
      filter: true,
      methods: ['GET'],
      operations: ['SELECT', 'DELETE'],
      required: true,
      safe: true,
      sanitize: true,
      normalize: true,
      validate: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
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
    },
    {
      key: 'archived',
      type: 'boolean',
      typeCheck: true,
      filter: true,
      methods: ['PUT'],
      operations: ['UPDATE'],
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

    it("should generate a valid SQL UPDATE query with name and age props and return Id", () => {
    const chunk = [
      { id: 1, name: 'John', age: 30 },
      { id: 2, name: 'Henry', age: 40 },
    ];
    const consumerId = 1;
    const consumerName = 'consumer';
    const { query, args } = entity.query.update(chunk, consumerId, consumerName);
    expect(query).toBe(`UPDATE \"persons\" SET name = CASE WHEN id = $1 THEN $3 WHEN id = $2 THEN $4 ELSE name END, age = CASE WHEN id = $1 THEN $5 WHEN id = $2 THEN $6 ELSE age END, \"consumerId\" = CASE WHEN id = $1 THEN $7 WHEN id = $2 THEN $8 ELSE \"consumerId\" END, \"consumerName\" = CASE WHEN id = $1 THEN $9 WHEN id = $2 THEN $10 ELSE \"consumerName\" END WHERE id IN ($1, $2)`);
    expect(args).toEqual([
      1, 2, 'John', 'Henry', 30, 40, 1, 1, 'consumer', 'consumer'
    ]);
  });

  it("should generate a valid SQL UPDATE query without consumerId and consumerName", () => {
    const chunk = [
      { id: 1, name: 'John', age: 30 },
      { id: 2, name: 'Henry', age: 40 },
    ];
    const { query, args } = entity.query.update(chunk);
    expect(query).toBe(`UPDATE \"persons\" SET name = CASE WHEN id = $1 THEN $3 WHEN id = $2 THEN $4 ELSE name END, age = CASE WHEN id = $1 THEN $5 WHEN id = $2 THEN $6 ELSE age END WHERE id IN ($1, $2)`);
    expect(args).toEqual([
      1, 2, 'John', 'Henry', 30, 40
    ]);
  });

  it("should generate a valid SQL UPDATE query without consumerId and consumerName", () => {
    const chunk = [
      { id: 1, accessToken: 'Jxxxx', refreshToken: 'fdjlz' },
      { id: 2, accessToken: 'Jyyyy', refreshToken: 'fghkl' },
    ];
    const { query, args } = consumerEntity.query.update(chunk);
    expect(query).toBe(`UPDATE \"consumer\" SET \"accessToken\" = CASE WHEN id = $1 THEN $3 WHEN id = $2 THEN $4 ELSE \"accessToken\" END, \"refreshToken\" = CASE WHEN id = $1 THEN $5 WHEN id = $2 THEN $6 ELSE \"refreshToken\" END WHERE id IN ($1, $2)`);
    expect(args).toEqual([
      1, 2, 'Jxxxx', 'Jyyyy', 'fdjlz', 'fghkl'
    ]);
  });

  it("should generate a valid SQL UPDATE query without consumerId and consumerName and one row", () => {
    const chunk = [
      { id: 1, accessToken: 'Jxxxx', refreshToken: 'fdjlz' },
    ];
    const { query, args } = consumerEntity.query.update(chunk);
    expect(query).toBe(`UPDATE \"consumer\" SET \"accessToken\" = CASE WHEN id = $1 THEN $2 ELSE \"accessToken\" END, \"refreshToken\" = CASE WHEN id = $1 THEN $3 ELSE \"refreshToken\" END WHERE id IN ($1)`);
    expect(args).toEqual([
      1, 'Jxxxx', 'fdjlz'
    ]);
  });

});