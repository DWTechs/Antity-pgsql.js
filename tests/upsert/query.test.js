import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("upsert query function", () => {
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
    },
    {
      key: 'email',
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

  it("should generate a valid SQL UPSERT query with single conflict target and return Id", () => {
    const rows = [
      { id: 1, name: 'John', age: 30, email: 'john@example.com' },
      { id: 2, name: 'Henry', age: 40, email: 'henry@example.com' },
    ];
    const conflictTarget = 'id';
    const consumerId = 1;
    const consumerName = 'consumer';
    const rtn = entity.query.return("id");
    const { query, args } = entity.query.upsert(rows, conflictTarget, consumerId, consumerName, rtn);
    
    expect(query).toBe(
      'INSERT INTO public.persons (name, age, email, "consumerId", "consumerName") VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age, email = EXCLUDED.email, "consumerId" = EXCLUDED."consumerId", "consumerName" = EXCLUDED."consumerName" RETURNING id'
    );
    expect(args).toEqual([
      'John', 30, 'john@example.com', 1, 'consumer',
      'Henry', 40, 'henry@example.com', 1, 'consumer'
    ]);
  });

  it("should generate a valid SQL UPSERT query with email as conflict target", () => {
    const rows = [
      { name: 'John', age: 30, email: 'john@example.com' },
      { name: 'Henry', age: 40, email: 'henry@example.com' },
    ];
    const conflictTarget = 'email';
    const consumerId = 1;
    const consumerName = 'consumer';
    const rtn = entity.query.return("id");
    const { query, args } = entity.query.upsert(rows, conflictTarget, consumerId, consumerName, rtn);
    
    expect(query).toBe(
      'INSERT INTO public.persons (name, age, email, "consumerId", "consumerName") VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age, "consumerId" = EXCLUDED."consumerId", "consumerName" = EXCLUDED."consumerName" RETURNING id'
    );
    expect(args).toEqual([
      'John', 30, 'john@example.com', 1, 'consumer',
      'Henry', 40, 'henry@example.com', 1, 'consumer'
    ]);
  });

  it("should generate a valid SQL UPSERT query with multiple conflict targets", () => {
    const rows = [
      { name: 'John', age: 30, email: 'john@example.com' },
    ];
    const conflictTarget = ['name', 'email'];
    const consumerId = 1;
    const consumerName = 'consumer';
    const rtn = entity.query.return("id");
    const { query, args } = entity.query.upsert(rows, conflictTarget, consumerId, consumerName, rtn);
    
    expect(query).toBe(
      'INSERT INTO public.persons (name, age, email, "consumerId", "consumerName") VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name, email) DO UPDATE SET age = EXCLUDED.age, "consumerId" = EXCLUDED."consumerId", "consumerName" = EXCLUDED."consumerName" RETURNING id'
    );
    expect(args).toEqual([
      'John', 30, 'john@example.com', 1, 'consumer'
    ]);
  });

  it("should generate a valid SQL UPSERT query without consumer tracking", () => {
    const rows = [
      { id: 1, name: 'John', age: 30, email: 'john@example.com' },
    ];
    const conflictTarget = 'id';
    const rtn = entity.query.return("id");
    const { query, args } = entity.query.upsert(rows, conflictTarget, undefined, undefined, rtn);
    
    expect(query).toBe(
      'INSERT INTO public.persons (name, age, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age, email = EXCLUDED.email RETURNING id'
    );
    expect(args).toEqual([
      'John', 30, 'john@example.com'
    ]);
  });

  it("should generate a valid SQL UPSERT query without RETURNING clause", () => {
    const rows = [
      { id: 1, name: 'John', age: 30, email: 'john@example.com' },
    ];
    const conflictTarget = 'id';
    const consumerId = 1;
    const consumerName = 'consumer';
    const { query, args } = entity.query.upsert(rows, conflictTarget, consumerId, consumerName, "");
    
    expect(query).toBe(
      'INSERT INTO public.persons (name, age, email, "consumerId", "consumerName") VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age, email = EXCLUDED.email, "consumerId" = EXCLUDED."consumerId", "consumerName" = EXCLUDED."consumerName"'
    );
    expect(args).toEqual([
      'John', 30, 'john@example.com', 1, 'consumer'
    ]);
  });

  it("should throw error when conflictTarget is not provided", () => {
    const rows = [
      { id: 1, name: 'John', age: 30, email: 'john@example.com' },
    ];
    
    expect(() => {
      entity.query.upsert(rows, '', 1, 'consumer', '');
    }).toThrow('conflictTarget must be provided for upsert operation');
  });

  it("should throw error when conflictTarget is an empty array", () => {
    const rows = [
      { id: 1, name: 'John', age: 30, email: 'john@example.com' },
    ];
    
    expect(() => {
      entity.query.upsert(rows, [], 1, 'consumer', '');
    }).toThrow('conflictTarget must be provided for upsert operation');
  });

  it("should handle uppercase column names correctly", () => {
    const entityWithUppercase = new SQLEntity('Persons', [
      {
        key: 'Name',
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
        key: 'Email',
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

    const rows = [
      { Name: 'John', Email: 'john@example.com' },
    ];
    const conflictTarget = 'Email';
    const rtn = entityWithUppercase.query.return("id");
    const { query, args } = entityWithUppercase.query.upsert(rows, conflictTarget, undefined, undefined, rtn);
    
    expect(query).toBe(
      'INSERT INTO public."Persons" ("Name", "Email") VALUES ($1, $2) ON CONFLICT ("Email") DO UPDATE SET "Name" = EXCLUDED."Name" RETURNING id'
    );
    expect(args).toEqual([
      'John', 'john@example.com'
    ]);
  });
});
