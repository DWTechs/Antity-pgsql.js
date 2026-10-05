import { SQLEntity } from '../../dist/antity-pgsql.js';

describe("SQLEntity table/schema setters", () => {
  const makeEntity = () => new SQLEntity('persons', [
    {
      key: 'id',
      type: 'integer',
      min: 1,
      max: 999999999,
      isTypeChecked: true,
      isFilterable: true,
      requiredFor: [],
      operations: ['SELECT'],
      isPrivate: false,
      sanitizer: null,
      normalizer: null,
      validator: null
    }
  ], 'app');

  describe('table', () => {
    it('should update the table name when given a non-empty string', () => {
      const entity = makeEntity();
      entity.table = 'employees';
      expect(entity.table).toBe('employees');
    });

    it('should throw when set to an empty string', () => {
      const entity = makeEntity();
      expect(() => { entity.table = ''; }).toThrow('table must be a string of length > 0');
    });

    it('should throw when set to a non-string value', () => {
      const entity = makeEntity();
      expect(() => { entity.table = 42; }).toThrow('table must be a string of length > 0');
    });
  });

  describe('schema', () => {
    it('should update the schema name when given a non-empty string', () => {
      const entity = makeEntity();
      entity.schema = 'reporting';
      expect(entity.schema).toBe('reporting');
    });

    it('should throw when set to an empty string', () => {
      const entity = makeEntity();
      expect(() => { entity.schema = ''; }).toThrow('schema must be a string of length > 0');
    });

    it('should throw when set to a non-string value', () => {
      const entity = makeEntity();
      expect(() => { entity.schema = null; }).toThrow('schema must be a string of length > 0');
    });
  });

  describe('identifier hardening', () => {
    it('should reject a table name containing a semicolon', () => {
      const entity = makeEntity();
      expect(() => { entity.table = 'foo;drop table users'; }).toThrow('valid SQL identifier');
    });

    it('should reject a table name containing whitespace', () => {
      const entity = makeEntity();
      expect(() => { entity.table = 'foo bar'; }).toThrow('valid SQL identifier');
    });

    it('should reject a schema name starting with a digit', () => {
      const entity = makeEntity();
      expect(() => { entity.schema = '1schema'; }).toThrow('valid SQL identifier');
    });

    it('should accept an identifier containing uppercase letters', () => {
      const entity = makeEntity();
      entity.table = 'Users';
      expect(entity.table).toBe('Users');
    });

    it('should reject an unsafe schema name passed to the constructor', () => {
      expect(() => new SQLEntity('persons', [
        {
          key: 'id',
          type: 'integer',
          min: 1,
          max: 999999999,
          isTypeChecked: true,
          isFilterable: true,
          requiredFor: [],
          operations: ['SELECT'],
          isPrivate: false,
          sanitizer: null,
          normalizer: null,
          validator: null
        }
      ], 'schema;drop table')).toThrow('valid SQL identifier');
    });
  });
});
