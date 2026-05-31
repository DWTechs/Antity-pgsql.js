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
    {
      key: 'tags',
      type: 'array',
      isFilterable: true,
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

  // Tests for direct SQL comparators (0.17.3)
  describe('direct SQL comparators as matchMode', () => {
    it('should accept "=" as a valid matchMode for a string property', () => {
      const filters = { name: [{ value: 'John', matchMode: '=' }] };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({ name: [{ value: 'John', matchMode: '=' }] });
    });

    it('should accept ">=" as a valid matchMode for a number property', () => {
      const filters = { age: [{ value: 18, matchMode: '>=' }] };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({ age: [{ value: 18, matchMode: '>=' }] });
    });

    it('should accept "<=" as a valid matchMode for a number property', () => {
      const filters = { age: [{ value: 65, matchMode: '<=' }] };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({ age: [{ value: 65, matchMode: '<=' }] });
    });

    it('should accept "<>" as a valid matchMode', () => {
      const filters = { name: [{ value: 'admin', matchMode: '<>' }] };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({ name: [{ value: 'admin', matchMode: '<>' }] });
    });

    it('should accept "LIKE" as a valid matchMode for a string property', () => {
      const filters = { name: [{ value: '%John%', matchMode: 'LIKE' }] };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({ name: [{ value: '%John%', matchMode: 'LIKE' }] });
    });

    it('should accept "NOT LIKE" as a valid matchMode for a string property', () => {
      const filters = { name: [{ value: '%admin%', matchMode: 'NOT LIKE' }] };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({ name: [{ value: '%admin%', matchMode: 'NOT LIKE' }] });
    });

    it('should accept "IS" as a valid matchMode', () => {
      const filters = { archived: [{ value: false, matchMode: 'IS' }] };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({ archived: [{ value: false, matchMode: 'IS' }] });
    });

    it('should accept "IS NOT" as a valid matchMode', () => {
      const filters = { archived: [{ value: false, matchMode: 'IS NOT' }] };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({ archived: [{ value: false, matchMode: 'IS NOT' }] });
    });

    it('should accept "IN" as a valid matchMode', () => {
      const filters = { name: [{ value: ['Alice', 'Bob'], matchMode: 'IN' }] };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({ name: [{ value: ['Alice', 'Bob'], matchMode: 'IN' }] });
    });

    it('should accept "NOT IN" as a valid matchMode', () => {
      const filters = { age: [{ value: [1, 2], matchMode: 'NOT IN' }] };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({ age: [{ value: [1, 2], matchMode: 'NOT IN' }] });
    });

    it('should still reject truly invalid matchMode alongside valid direct comparators', () => {
      const filters = {
        name: [
          { value: 'John', matchMode: 'LIKE' },
          { value: 'Jane', matchMode: 'invalidMode' },
        ],
      };
      const result = cleanFilters(filters, mockProperties);
      expect(result.name).toHaveLength(1);
      expect(result.name).toEqual([{ value: 'John', matchMode: 'LIKE' }]);
    });
  });

  // Tests for array-typed columns (PostgreSQL && overlap operator)
  describe('array type with && matchMode', () => {
    it('should convert "in" matchMode to "&&" for array-typed properties', () => {
      const filters = {
        tags: [{ value: [1, 2, 3], matchMode: 'in' }],
      };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({
        tags: [{ value: [1, 2, 3], matchMode: '&&' }],
      });
    });

    it('should convert "in" matchMode to "&&" in old format for array-typed properties', () => {
      const filters = {
        tags: { value: [1, 2], matchMode: 'in' },
      };
      const result = cleanFilters(filters, mockProperties);
      expect(result).toEqual({
        tags: [{ value: [1, 2], matchMode: '&&' }],
      });
    });

    it('should reject invalid matchMode for array-typed properties', () => {
      const filters = {
        tags: [{ value: [1, 2], matchMode: 'contains' }],
      };
      const result = cleanFilters(filters, mockProperties);
      expect(result.tags).toBeUndefined();
    });
  });
});
