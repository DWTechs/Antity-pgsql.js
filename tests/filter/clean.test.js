import { cleanFilters } from '../../build/es6/filter/clean.js';

/**
 * Tests for cleanFilters function with both old and new filter structures
 * New format (array):
 * {
 *   archived: [{value: false, matchMode: "equals"}],
 *   name: [{value: "cap", matchMode: "contains", operator: "and"}]
 * }
 * Old format (object) - still supported:
 * {
 *   archived: {value: false, matchMode: "equals"},
 *   name: {value: "cap", matchMode: "contains"}
 * }
 */

describe('cleanFilters', () => {
  const mockProperties = [
    {
      key: 'name',
      type: 'string',
      isFilterable: true,
    },
    {
      key: 'age',
      type: 'number',
      isFilterable: true,
    },
    {
      key: 'archived',
      type: 'boolean',
      isFilterable: true,
    },
    {
      key: 'email',
      type: 'string',
      isFilterable: false,
    },
  ];

  it('should validate filters with array structure', () => {
    const filters = {
      name: [{ value: 'John', matchMode: 'contains' }],
      age: [{ value: 30, matchMode: 'equals' }],
    };

    const result = cleanFilters(filters, mockProperties);

    expect(result).toEqual({
      name: [{ value: 'John', matchMode: 'contains' }],
      age: [{ value: 30, matchMode: 'equals' }],
    });
  });

  it('should handle multiple filters for the same property', () => {
    const filters = {
      name: [
        { value: 'John', matchMode: 'contains', operator: 'or' },
        { value: 'Jane', matchMode: 'contains', operator: 'or' },
      ],
    };

    const result = cleanFilters(filters, mockProperties);

    expect(result).toEqual({
      name: [
        { value: 'John', matchMode: 'contains', operator: 'or' },
        { value: 'Jane', matchMode: 'contains', operator: 'or' },
      ],
    });
  });

  it('should remove filters for unknown properties', () => {
    const filters = {
      name: [{ value: 'John', matchMode: 'contains' }],
      unknownProp: [{ value: 'test', matchMode: 'equals' }],
    };

    const result = cleanFilters(filters, mockProperties);

    expect(result).toEqual({
      name: [{ value: 'John', matchMode: 'contains' }],
    });
    expect(result.unknownProp).toBeUndefined();
  });

  it('should remove filters for unfilterable properties', () => {
    const filters = {
      name: [{ value: 'John', matchMode: 'contains' }],
      email: [{ value: 'test@example.com', matchMode: 'equals' }],
    };

    const result = cleanFilters(filters, mockProperties);

    expect(result).toEqual({
      name: [{ value: 'John', matchMode: 'contains' }],
    });
    expect(result.email).toBeUndefined();
  });

  it('should remove invalid filters but keep valid ones in the array', () => {
    const filters = {
      name: [
        { value: 'John', matchMode: 'contains' },
        { value: 'Jane', matchMode: 'invalidMatchMode' },
        { value: 'Bob', matchMode: 'startsWith' },
      ],
    };

    const result = cleanFilters(filters, mockProperties);

    expect(result.name).toHaveLength(2);
    expect(result.name).toEqual([
      { value: 'John', matchMode: 'contains' },
      { value: 'Bob', matchMode: 'startsWith' },
    ]);
  });

  it('should remove property entirely if all filters are invalid', () => {
    const filters = {
      name: [
        { value: 'John', matchMode: 'invalidMatchMode1' },
        { value: 'Jane', matchMode: 'invalidMatchMode2' },
      ],
      age: [{ value: 30, matchMode: 'equals' }],
    };

    const result = cleanFilters(filters, mockProperties);

    expect(result).toEqual({
      age: [{ value: 30, matchMode: 'equals' }],
    });
    expect(result.name).toBeUndefined();
  });

  it('should handle boolean filters correctly', () => {
    const filters = {
      archived: [{ value: false, matchMode: 'equals' }],
    };

    const result = cleanFilters(filters, mockProperties);

    expect(result).toEqual({
      archived: [{ value: false, matchMode: 'equals' }],
    });
  });

  it('should handle filters with operator field', () => {
    const filters = {
      name: [{ value: 'cap', matchMode: 'contains', operator: 'and' }],
      archived: [{ value: false, matchMode: 'equals' }],
    };

    const result = cleanFilters(filters, mockProperties);

    expect(result).toEqual({
      name: [{ value: 'cap', matchMode: 'contains', operator: 'and' }],
      archived: [{ value: false, matchMode: 'equals' }],
    });
  });

  it('should return empty object when all filters are invalid', () => {
    const filters = {
      unknownProp: [{ value: 'test', matchMode: 'equals' }],
      email: [{ value: 'test@example.com', matchMode: 'equals' }],
    };

    const result = cleanFilters(filters, mockProperties);

    expect(result).toEqual({});
  });

  // Tests for old format (backward compatibility)
  describe('backward compatibility with old format (single objects)', () => {
    it('should handle old format with single filter object and convert to array', () => {
      const filters = {
        name: { value: 'John', matchMode: 'contains' },
        age: { value: 30, matchMode: 'equals' },
      };

      const result = cleanFilters(filters, mockProperties);

      expect(result).toEqual({
        name: [{ value: 'John', matchMode: 'contains' }],
        age: [{ value: 30, matchMode: 'equals' }],
      });
    });

    it('should handle old format with boolean filters', () => {
      const filters = {
        archived: { value: false, matchMode: 'equals' },
      };

      const result = cleanFilters(filters, mockProperties);

      expect(result).toEqual({
        archived: [{ value: false, matchMode: 'equals' }],
      });
    });

    it('should remove invalid filters in old format', () => {
      const filters = {
        name: { value: 'John', matchMode: 'invalidMode' },
        age: { value: 30, matchMode: 'equals' },
      };

      const result = cleanFilters(filters, mockProperties);

      expect(result).toEqual({
        age: [{ value: 30, matchMode: 'equals' }],
      });
      expect(result.name).toBeUndefined();
    });

    it('should handle mixed old and new formats', () => {
      const filters = {
        name: { value: 'John', matchMode: 'contains' }, // old format
        age: [{ value: 30, matchMode: 'equals' }], // new format
        archived: [{ value: false, matchMode: 'equals' }], // new format
      };

      const result = cleanFilters(filters, mockProperties);

      expect(result).toEqual({
        name: [{ value: 'John', matchMode: 'contains' }],
        age: [{ value: 30, matchMode: 'equals' }],
        archived: [{ value: false, matchMode: 'equals' }],
      });
    });

    it('should remove unknown properties in old format', () => {
      const filters = {
        name: { value: 'John', matchMode: 'contains' },
        unknownProp: { value: 'test', matchMode: 'equals' },
      };

      const result = cleanFilters(filters, mockProperties);

      expect(result).toEqual({
        name: [{ value: 'John', matchMode: 'contains' }],
      });
      expect(result.unknownProp).toBeUndefined();
    });
  });
});
