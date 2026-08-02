import { type } from '../build/es6/map.js';

describe('type', () => {

  describe('types mapped to "number"', () => {
    it.each([
      'integer', 'float', 'even', 'odd', 'positive', 'negative', 'powerOfTwo', 'ascii',
    ])('should map "%s" to "number"', (entityType) => {
      expect(type(entityType)).toBe('number');
    });
  });

  describe('types mapped to "string"', () => {
    it.each([
      'jwt', 'symbol', 'password', 'email', 'regex', 'ipAddress', 'slug', 'hexadecimal',
      'function', 'htmlElement', 'htmlEventAttribute', 'node', 'json', 'object',
    ])('should map "%s" to "string"', (entityType) => {
      expect(type(entityType)).toBe('string');
    });
  });

  describe('types mapped to "date"', () => {
    it.each([
      'date', 'timestamp',
    ])('should map "%s" to "date"', (entityType) => {
      expect(type(entityType)).toBe('date');
    });
  });

  describe('type mapped to "array"', () => {
    it('should map "array" to "array"', () => {
      expect(type('array')).toBe('array');
    });
  });

  describe('unrecognized types', () => {
    it('should default to "string" for an unrecognized type', () => {
      expect(type('boolean')).toBe('string');
    });

    it('should default to "string" for an undefined type', () => {
      expect(type(undefined)).toBe('string');
    });
  });

});
