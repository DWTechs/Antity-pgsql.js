import { mapComparator, COMPARATORS } from '../../build/es6/filter/map/comparator.js';

describe('mapComparator', () => {

  describe('direct SQL comparators', () => {
    it.each([...COMPARATORS])('should return "%s" as-is when passed directly', (comparator) => {
      expect(mapComparator(comparator)).toBe(comparator);
    });
  });

  describe('semantic match modes', () => {
    it.each([
      ['startsWith', 'LIKE'],
      ['endsWith', 'LIKE'],
      ['contains', 'LIKE'],
      ['notContains', 'NOT LIKE'],
      ['equals', '='],
      ['notEquals', '<>'],
      ['in', 'IN'],
      ['notIn', 'NOT IN'],
      ['lt', '<'],
      ['lte', '<='],
      ['gt', '>'],
      ['gte', '>='],
      ['is', 'IS'],
      ['dateIs', 'IS'],
      ['isNot', 'IS NOT'],
      ['dateIsNot', 'IS NOT'],
      ['before', '<'],
      ['dateBefore', '<'],
      ['after', '>'],
      ['dateAfter', '>'],
    ])('should map "%s" to "%s"', (matchMode, comparator) => {
      expect(mapComparator(matchMode)).toBe(comparator);
    });
  });

  describe('unrecognized match modes', () => {
    it('should return null for an unrecognized match mode', () => {
      expect(mapComparator('unknown')).toBeNull();
    });

    it('should return null when matchMode is undefined', () => {
      expect(mapComparator(undefined)).toBeNull();
    });
  });

});
