import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("query function", () => {
  const entity = new SQLEntity('persons', [
    {
      key: 'id',
      type: 'number',
      min: 1,
      max: 255,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: [],
      operations: ['SELECT', 'DELETE'],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null
    },
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
      key: 'archived',
      type: 'boolean',
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: [],
      operations: ['SELECT'],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null
    }
  ]);

  it("should generate a valid SQL archive query for multiple rows with consumer", () => {
    const chunk = [
      { id: 1 },
      { id: 2 },
    ];
    const consumer = { id: 1, nickname: 'consumer' };
    const { query, args } = entity.query.archive(chunk, consumer);
    expect(query).toBe(`UPDATE public.persons SET archived = true, updaterid = $3, name = $4 WHERE id IN ($1, $2)`);
    expect(args).toEqual([1, 2, 1, 'consumer']);
  });

  it("should generate a valid SQL archive query for multiple rows without consumer", () => {
    const chunk = [
      { id: 1 },
      { id: 2 },
    ];
    const { query, args } = entity.query.archive(chunk);
    expect(query).toBe(`UPDATE public.persons SET archived = true WHERE id IN ($1, $2)`);
    expect(args).toEqual([1, 2]);
  });

  it("should generate a valid SQL archive query for a single row with consumer", () => {
    const chunk = [{ id: 1 }];
    const consumer = { id: 42, nickname: 'admin' };
    const { query, args } = entity.query.archive(chunk, consumer);
    expect(query).toBe(`UPDATE public.persons SET archived = true, updaterid = $2, name = $3 WHERE id IN ($1)`);
    expect(args).toEqual([1, 42, 'admin']);
  });

  it("should generate a valid SQL archive query for a single row without consumer", () => {
    const chunk = [{ id: 5 }];
    const { query, args } = entity.query.archive(chunk);
    expect(query).toBe(`UPDATE public.persons SET archived = true WHERE id IN ($1)`);
    expect(args).toEqual([5]);
  });

});