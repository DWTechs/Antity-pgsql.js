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
      need: ['POST', 'PUT'],
      operations: ['SELECT', 'INSERT', 'UPDATE'],
      send: true,
      safe: true,
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
      need: ['PUT'],
      operations: ['SELECT', 'UPDATE'],
      send: true,
      safe: true,
      sanitizer: null,
      normalizer: null,
      validator: null
    }
  ]);
  
  it("should generate a valid SQL RETURN query with given prop", () => {
    const result = entity.query.return("id");
    expect(result).toBe("RETURNING id");
  });

});