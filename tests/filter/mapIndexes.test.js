import { mapIndexes } from '../../build/es6/filter/map/index.js';

describe('mapIndexes', () => {

  describe('matchMode "in"', () => {
    it('should return indexes wrapped in parentheses', () => {
      const result = mapIndexes([1, 2], 'in', null);
      expect(result).toBe('($1,$2)');
    });

    it('should return a single index wrapped in parentheses', () => {
      const result = mapIndexes([1], 'in', null);
      expect(result).toBe('($1)');
    });
  });

  describe('matchMode "notIn"', () => {
    it('should return indexes wrapped in parentheses', () => {
      const result = mapIndexes([1, 2, 3], 'notIn', null);
      expect(result).toBe('($1,$2,$3)');
    });

    it('should return a single index wrapped in parentheses', () => {
      const result = mapIndexes([5], 'notIn', null);
      expect(result).toBe('($5)');
    });
  });

  describe('matchMode "IN"', () => {
    it('should return indexes wrapped in parentheses', () => {
      const result = mapIndexes([1], 'IN', null);
      expect(result).toBe('($1)');
    });
  });

  describe('matchMode "NOT IN"', () => {
    it('should return indexes wrapped in parentheses', () => {
      const result = mapIndexes([4, 5], 'NOT IN', null);
      expect(result).toBe('($4,$5)');
    });
  });

  describe('matchMode "&&"', () => {
    it('should return ARRAY syntax with integer cast when value is an array of integers', () => {
      const result = mapIndexes([1, 2], '&&', [10, 20]);
      expect(result).toBe('ARRAY[$1,$2]::integer[]');
    });

    it('should return ARRAY syntax with varchar cast when value is an array of strings', () => {
      const result = mapIndexes([1, 2], '&&', ['hello', 'world']);
      expect(result).toBe('ARRAY[$1,$2]::varchar[]');
    });

    it('should return ARRAY syntax with numeric cast when value is an array of floats', () => {
      const result = mapIndexes([1, 2], '&&', [1.5, 2.7]);
      expect(result).toBe('ARRAY[$1,$2]::numeric[]');
    });

    it('should return ARRAY syntax with boolean cast when value is an array of booleans', () => {
      const result = mapIndexes([1, 2], '&&', [true, false]);
      expect(result).toBe('ARRAY[$1,$2]::boolean[]');
    });

    it('should return ARRAY syntax with empty cast when value is an empty array', () => {
      const result = mapIndexes([1], '&&', []);
      expect(result).toBe('ARRAY[$1]::[]');
    });

    it('should return ARRAY syntax with empty cast when value is null', () => {
      const result = mapIndexes([1, 2, 3], '&&', null);
      expect(result).toBe('ARRAY[$1,$2,$3]::[]');
    });

    it('should return ARRAY syntax with empty cast when value is not an array', () => {
      const result = mapIndexes([1], '&&', 'notAnArray');
      expect(result).toBe('ARRAY[$1]::[]');
    });

    it('should return ARRAY syntax with varchar cast when value contains mixed types', () => {
      const result = mapIndexes([1, 2], '&&', ['text', 42]);
      expect(result).toBe('ARRAY[$1,$2]::varchar[]');
    });

    it('should return ARRAY syntax with integer cast for single integer value in array', () => {
      const result = mapIndexes([3], '&&', [7]);
      expect(result).toBe('ARRAY[$3]::integer[]');
    });

    it('should return ARRAY syntax with integer cast when first element is 0', () => {
      const result = mapIndexes([1, 2], '&&', [0, 1]);
      expect(result).toBe('ARRAY[$1,$2]::integer[]');
    });

    it('should return ARRAY syntax with integer cast when first element is negative', () => {
      const result = mapIndexes([1, 2], '&&', [-3, -1]);
      expect(result).toBe('ARRAY[$1,$2]::integer[]');
    });

    it('should return ARRAY syntax with integer cast when array starts with integer followed by float', () => {
      const result = mapIndexes([1, 2], '&&', [1, 2.5]);
      expect(result).toBe('ARRAY[$1,$2]::integer[]');
    });

    it('should return ARRAY syntax with boolean cast when first element is false', () => {
      const result = mapIndexes([1], '&&', [false]);
      expect(result).toBe('ARRAY[$1]::boolean[]');
    });

    it('should return ARRAY syntax with empty cast when value is undefined', () => {
      const result = mapIndexes([1, 2], '&&', undefined);
      expect(result).toBe('ARRAY[$1,$2]::[]');
    });
  });

  describe('default matchMode', () => {
    it('should return plain indexes when matchMode is undefined', () => {
      const result = mapIndexes([1, 2], undefined, null);
      expect(result).toBe('$1,$2');
    });

    it('should return plain indexes when matchMode is "equals"', () => {
      const result = mapIndexes([1], 'equals', null);
      expect(result).toBe('$1');
    });
  });

});
