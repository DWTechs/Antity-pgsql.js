import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("query function", () => {
  const entity = new SQLEntity('persons', [
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
      normalizer: val => val.toLowerCase(),
      validator: null
    },
    {
      key: 'age',
      type: 'integer',
      min: 0,
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
  const entity2 = new SQLEntity('persons', [
    {
      key: 'name',
      type: 'string',
      min: 1,
      max: 255,
      isTypeChecked: true,
      requiredFor: ['PUT'],
      operations: ['SELECT', 'UPDATE'],
      isPrivate: false,
      sanitizer: null,
      normalizer: val => val.toLowerCase(),
      validator: null
    },
    {
      key: 'age',
      type: 'integer',
      min: 0,
      max: 120,
      isTypeChecked: true,
      requiredFor: ['POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      isPrivate: false,
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
    const consumer = { id: 1, nickname: 'consumer' };
    const rtn = entity.query.return("id");
    const { query, args } = entity.query.insert(chunk, consumer, rtn);
    expect(query).toBe(
      'INSERT INTO public.persons (name, age, creatorId, name) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8) RETURNING id'
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
    const consumer = { id: 1, nickname: 'consumer' };
    const rtn = "";
    const { query, args } = entity.query.insert(chunk, consumer, rtn);
    expect(query).toBe(
      'INSERT INTO public.persons (name, age, creatorId, name) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)'
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
    const consumer = { id: 1, nickname: 'consumer' };
    const rtn = entity2.query.return("id");
    const { query, args } = entity2.query.insert(chunk, consumer, rtn);
    expect(query).toBe(
      'INSERT INTO public.persons (age, creatorId, name) VALUES ($1, $2, $3), ($4, $5, $6) RETURNING id'
    );
    expect(args).toEqual([
      30, consumer.id, consumer.nickname,
      40, consumer.id, consumer.nickname
    ]);
  });

  it("should generate a valid SQL INSERT query without consumer id and nickname", () => {
    const chunk = [
      { name: 'John', age: 30 },
      { name: 'Henry', age: 40 },
    ];
    const rtn = entity.query.return("id");
    const { query, args } = entity.query.insert(chunk, undefined, rtn);
    expect(query).toBe(
      'INSERT INTO public.persons (name, age) VALUES ($1, $2), ($3, $4) RETURNING id'
    );
    expect(args).toEqual([
      'John', 30,
      'Henry', 40
    ]);
  });

  it("should generate a valid SQL INSERT query without consumer id and nickname and no return", () => {
    const chunk = [
      { name: 'John', age: 30 },
      { name: 'Henry', age: 40 },
    ];
    const { query, args } = entity.query.insert(chunk);
    expect(query).toBe(
      'INSERT INTO public.persons (name, age) VALUES ($1, $2), ($3, $4)'
    );
    expect(args).toEqual([
      'John', 30,
      'Henry', 40
    ]);
  });

});