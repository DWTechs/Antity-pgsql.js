import { matchMode } from '../build/es6/check.js';

describe('matchMode', () => {
  describe('number', () => {
    it('should accept "IS" for null-checking a numeric column', () => {
      expect(matchMode('number', 'IS')).toBe(true);
    });

    it('should accept "isNot" for null-checking a numeric column', () => {
      expect(matchMode('number', 'isNot')).toBe(true);
    });

    it('should reject an unrelated match mode', () => {
      expect(matchMode('number', 'contains')).toBe(false);
    });
  });

  describe('string', () => {
    it('should accept the lowercase "is" semantic form', () => {
      expect(matchMode('string', 'is')).toBe(true);
    });

    it('should accept the lowercase "isNot" semantic form', () => {
      expect(matchMode('string', 'isNot')).toBe(true);
    });

    it('should still accept the uppercase "IS"/"IS NOT" forms', () => {
      expect(matchMode('string', 'IS')).toBe(true);
      expect(matchMode('string', 'IS NOT')).toBe(true);
    });
  });

  describe('boolean', () => {
    it('should accept "is"/"isNot"', () => {
      expect(matchMode('boolean', 'is')).toBe(true);
      expect(matchMode('boolean', 'isNot')).toBe(true);
    });

    it('should reject string-only match modes like "contains"', () => {
      expect(matchMode('boolean', 'contains')).toBe(false);
      expect(matchMode('boolean', 'startsWith')).toBe(false);
    });
  });

  describe('array', () => {
    it('should only accept the "&&" overlap operator', () => {
      expect(matchMode('array', '&&')).toBe(true);
      expect(matchMode('array', 'in')).toBe(false);
    });
  });
});
