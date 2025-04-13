import { SQLEntity } from '../dist/antity-pgsql.js';

describe('SQLEntity', () => {
  let entity;
  beforeEach(() => {
    entity = new SQLEntity('persons', [
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
        methods: ['GET', 'POST', 'PUT'],
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
  });
  
  test('should return proper cols for select as string', () => {
    const cols = entity.getColsByOp("SELECT", true);
    expect(cols).toBe('name, age');
  });

  test('should return proper cols for select as array', () => {
    const cols = entity.getColsByOp("SELECT", false);
    expect(cols).toStrictEqual(["name", "age"]);
  });

  test('should return proper cols as string for select with pagination', () => {
    const cols = entity.getColsByOp("SELECT", true, true);
    expect(cols).toBe('name, age, COUNT(*) OVER () AS total');
  });

  test('should return proper cols as array for select with pagination', () => {
    const cols = entity.getColsByOp("SELECT", false, true);
    expect(cols).toStrictEqual(["name", "age", "COUNT(*) OVER () AS total"]);
  });

  test('should return proper cols as string for insert', () => {
    const cols = entity.getColsByOp("INSERT", true);
    expect(cols).toBe('name, age, consumerId, consumerName');
  });

  test('should return proper cols as array for insert', () => {
    const cols = entity.getColsByOp("INSERT", false);
    expect(cols).toStrictEqual(["name", "age", "consumerId", "consumerName"]);
  });

  test('should return proper cols as string for update', () => {
    const cols = entity.getColsByOp("UPDATE", true);
    expect(cols).toBe('name, age, consumerId, consumerName');
  });

  test('should return proper cols as array for update', () => {
    const cols = entity.getColsByOp("UPDATE", false);
    expect(cols).toStrictEqual(["name", "age", "consumerId", "consumerName"]);
  });

});
