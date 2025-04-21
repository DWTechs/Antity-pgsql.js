import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("query function", () => {
  const entity = new SQLEntity('persons', [
    {
      key: 'id',
      type: 'number',
      min: 1,
      max: 255,
      typeCheck: true,
      methods: ['GET'],
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
      methods: ['GET', 'POST', 'PUT'],
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
      methods: ['GET', 'PUT'],
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
      methods: ['PUT'],
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

    it("should generate a valid SQL archive query with name and age props", () => {
    const chunk = [
      { id: 1, archived: true },
      { id: 2, archived: true },
    ];
    const consumerId = 1;
    const consumerName = 'consumer';
    const { query, args } = entity.query.update(chunk, consumerId, consumerName);
    expect(query).toBe(`UPDATE \"persons\" SET archived = CASE WHEN id = $1 THEN $3 WHEN id = $2 THEN $4 END, consumerId = CASE WHEN id = $1 THEN $5 WHEN id = $2 THEN $6 END, consumerName = CASE WHEN id = $1 THEN $7 WHEN id = $2 THEN $8 END WHERE id IN ($1, $2)`);
    expect(args).toEqual([
      1, 2, true, true, 1, 1, 'consumer', 'consumer'
    ]);
  });


});