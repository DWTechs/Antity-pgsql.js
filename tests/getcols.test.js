import { Entity } from '../dist/antity.js';

describe('Entity', () => {
  let entity;
  beforeEach(() => {
    entity = new Entity('persons', [
      {
        key: 'name',
        type: 'string',
        min: 1,
        max: 255,
        typeCheck: true,
        operations: ['select', 'insert', 'update'],
        required: true,
        safe: true,
        sanitize: true,
        normalize: true,
        control: true,
        sanitizer: null,
        normalizer: val => val.toLowerCase(),
        controller: null
      },
      {
        key: 'age',
        type: 'integer',
        min: 0,
        max: 120,
        typeCheck: true,
        operations: ['select', 'insert', 'update'],
        required: true,
        safe: true,
        sanitize: true,
        normalize: false,
        control: true,
        sanitizer: null,
        normalizer: null,
        controller: null
      }
    ]);
  });
  
  test('should return proper cols for select', () => {
    const cols = entity.getCols("select", true);
    expect(cols).toBe('name, age');
  });

  test('should return proper cols for delect with pagination', () => {
    const cols = entity.getCols("select", true, true);
    expect(cols).toBe('name, age, COUNT(*) OVER () AS total');
  });

  test('should return proper cols for insert', () => {
    const cols = entity.getCols("insert", true);
    expect(cols).toBe('name, age');
  });

  test('should return proper cols for update', () => {
    const cols = entity.getCols("update", true);
    expect(cols).toBe('name = $1, age = $2');
  });

});
