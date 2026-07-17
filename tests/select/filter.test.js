
import { filter } from '../../dist/antity-pgsql.js';

// Builds the where clause with given filters
// Filters support two formats:
// 
// Simple format (old - still supported):
// filters={
//   "key1":{"value":"xxx", "matchMode":"contains"}, => string
//   "key2":{"value":[1,2], "matchMode":"in"}, => number[]
//   "key3":{"value":true, "matchMode":"equals"},  => boolean
// };
//
// Complex format (new - array-based):
// filters={
//   "key1":[{"value":"xxx", "matchMode":"contains", "operator":"or"}], => string with operator
//   "key2":[{"value":1, "matchMode":"equals"}, {"value":2, "matchMode":"equals", "operator":"or"}], => multiple filters
//   "key3":[{"value":false, "matchMode":"equals"}],  => boolean
// };
//
// MatchMode is optional.
// key is the name of a column in database
// aggregate columns must have an "Agg" suffix

// first: number,
// rows: number | null,
// sortField: string | null,
// sortOrder: Sort,
// filters: Filters | null,

describe('filter - simple format (backward compatibility)', () => {
    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'startsWith' }, age: { value: 30, matchMode: 'gte' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'startsWith' },
            age: { value: 30, matchMode: 'gte' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name LIKE $1 AND age >= $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John%', 30]);
    });

    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'endsWith' }, age: { value: 30, matchMode: 'lte' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'endsWith' },
            age: { value: 30, matchMode: 'lte' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name LIKE $1 AND age <= $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John', 30]);
    });

    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'contains' }, age: { value: 30, matchMode: 'gt' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'contains' },
            age: { value: 29, matchMode: 'gt' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name LIKE $1 AND age > $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 29]);
    });

    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'notContains' }, age: { value: 30, matchMode: 'lt' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'notContains' },
            age: { value: 31, matchMode: 'lt' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name NOT LIKE $1 AND age < $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 31]);
    });

    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'notContains' }, age: { value: 30, matchMode: 'equals' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'notContains' },
            age: { value: 30, matchMode: 'equals' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name NOT LIKE $1 AND age = $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 30]);
    });

    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'notContains' }, age: { value: 31, matchMode: 'notEquals' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'notContains' },
            age: { value: 31, matchMode: 'notEquals' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name NOT LIKE $1 AND age <> $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 31]);
    });

    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'notContains' }, age: { value: [30, 31, 32], matchMode: 'in' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'notContains' },
            age: { value: [30, 31, 32], matchMode: 'in' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name NOT LIKE $1 AND age IN ($2,$3,$4) ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 30, 31, 32]);
    });

    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'is' }, age: { value: 30, matchMode: 'is' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'is' },
            age: { value: 30, matchMode: 'is' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name IS $1 AND age IS $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 30]);
    });

    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'isNot' }, age: { value: 30, matchMode: 'isNot' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'isNot' },
            age: { value: 30, matchMode: 'isNot' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name IS NOT $1 AND age IS NOT $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 30]);
    });

    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'isNot' }, age: { value: 30, matchMode: 'before' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'isNot' },
            age: { value: 30, matchMode: 'before' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name IS NOT $1 AND age < $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 30]);
    });

    it("should generate correct SQL filter clause and arguments for filters = {name: { value: 'John', matchMode: 'isNot' }, age: { value: 30, matchMode: 'after' }};", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'isNot' },
            age: { value: 30, matchMode: 'after' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name IS NOT $1 AND age > $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 30]);
    });

    it('should handle empty filters and return only pagination and sorting', () => {
        const first = 5;
        const rows = 20;
        const sortField = 'createdAt';
        const sortOrder = 'DESC';
        const filters = null;

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' ORDER BY "createdAt" DESC LIMIT 20 OFFSET 5');
        expect(args).toEqual([]);
    });

    it('should handle filters with no sorting or pagination', () => {
        const first = null;
        const rows = null;
        const sortField = null;
        const sortOrder = null;
        const filters = {
            status: { value: 'active', matchMode: 'equals' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' WHERE status = $1');
        expect(args).toEqual(['active']);
    });

    it('should handle filters with unsupported match modes gracefully', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'unsupportedMode' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual([]);
    });

    it('should handle other limit and offset', () => {
        const first = 20;
        const rows = 100;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = null;

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' ORDER BY name ASC LIMIT 100 OFFSET 20');
        expect(args).toEqual([]);
    });

    it('should handle order by only', () => {
        const first = 0;
        const rows = 0;
        const sortField = 'name';
        const sortOrder = null;
        const filters = null;

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' ORDER BY name ASC');
        expect(args).toEqual([]);
    });

});

describe('filter - complex format (array-based)', () => {
    it("should generate correct SQL filter clause for single filter in array format", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: [{ value: 'John', matchMode: 'contains' }],
            archived: [{ value: false, matchMode: 'equals' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name LIKE $1 AND archived = $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', false]);
    });

    it("should generate correct SQL filter clause for multiple filters with OR operator", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: [
                { value: 'John', matchMode: 'contains', operator: 'or' },
                { value: 'Jane', matchMode: 'contains', operator: 'or' }
            ],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE (name LIKE $1 OR name LIKE $2) ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', '%Jane%']);
    });

    it("should generate correct SQL filter clause for multiple filters with AND operator", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            age: [
                { value: 18, matchMode: 'gte', operator: 'and' },
                { value: 65, matchMode: 'lte', operator: 'and' }
            ],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE (age >= $1 AND age <= $2) ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual([18, 65]);
    });

    it("should generate correct SQL filter clause combining multiple properties with array filters", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: [
                { value: 'John', matchMode: 'contains', operator: 'or' },
                { value: 'Jane', matchMode: 'contains', operator: 'or' }
            ],
            archived: [{ value: false, matchMode: 'equals' }],
            age: [{ value: 18, matchMode: 'gte' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE (name LIKE $1 OR name LIKE $2) AND archived = $3 AND age >= $4 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', '%Jane%', false, 18]);
    });

    it("should handle array format with IN matchMode", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'status';
        const sortOrder = 'ASC';
        const filters = {
            status: [{ value: ['active', 'pending', 'approved'], matchMode: 'in' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE status IN ($1,$2,$3) ORDER BY status ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['active', 'pending', 'approved']);
    });

    it("should handle multiple filters with different match modes", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'DESC';
        const filters = {
            name: [
                { value: 'John', matchMode: 'startsWith', operator: 'or' },
                { value: 'Doe', matchMode: 'endsWith', operator: 'or' }
            ],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE (name LIKE $1 OR name LIKE $2) ORDER BY name DESC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John%', '%Doe']);
    });

    it("should handle array format with notEquals and notContains", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: [{ value: 'Admin', matchMode: 'notContains' }],
            status: [{ value: 'deleted', matchMode: 'notEquals' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name NOT LIKE $1 AND status <> $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%Admin%', 'deleted']);
    });

    it("should handle mixed simple and complex filter formats", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'contains' }, // simple format
            age: [{ value: 30, matchMode: 'gte' }], // complex format
            archived: [{ value: false, matchMode: 'equals' }], // complex format
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name LIKE $1 AND age >= $2 AND archived = $3 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 30, false]);
    });

    it("should handle array format with IS and IS NOT", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            deletedAt: [{ value: null, matchMode: 'is' }],
            archivedAt: [{ value: null, matchMode: 'isNot' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE "deletedAt" IS NULL AND "archivedAt" IS NOT NULL ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual([]);
    });

    it("should handle IS / IS NOT with true and false literal values", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            archived: [{ value: false, matchMode: 'is' }],
            core: [{ value: true, matchMode: 'isNot' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE archived IS FALSE AND core IS NOT TRUE ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual([]);
    });

    it("should combine an equals filter with an IS NULL filter on the same property using OR", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            userId: [
                { value: 5, matchMode: 'equals', operator: 'OR' },
                { value: null, matchMode: 'is', operator: 'OR' },
            ],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE ("userId" = $1 OR "userId" IS NULL) ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual([5]);
    });

    it("should handle array format with before and after (date comparisons)", () => {
        const first = 0;
        const rows = 10;
        const sortField = 'createdAt';
        const sortOrder = 'DESC';
        const date = new Date('2024-01-01');
        const filters = {
            createdAt: [{ value: date, matchMode: 'after' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE "createdAt" > $1 ORDER BY "createdAt" DESC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual([date]);
    });

    it("should handle complex filters with no pagination", () => {
        const first = null;
        const rows = null;
        const sortField = null;
        const sortOrder = null;
        const filters = {
            status: [
                { value: 'active', matchMode: 'equals', operator: 'or' },
                { value: 'pending', matchMode: 'equals', operator: 'or' }
            ],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' WHERE (status = $1 OR status = $2)');
        expect(args).toEqual(['active', 'pending']);
    });

    it('should not include filters with empty string values in WHERE clause', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: [{ value: '', matchMode: 'contains' }],
            age: [{ value: 30, matchMode: 'equals' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' WHERE age = $1 ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual([30]);
    });

    it('should not include filters with empty arrays in WHERE clause', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'status';
        const sortOrder = 'ASC';
        const filters = {
            status: [{ value: [], matchMode: 'in' }],
            archived: [{ value: false, matchMode: 'equals' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' WHERE archived = $1 ORDER BY status ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual([false]);
    });

    it('should not include filters with null values in WHERE clause (except for IS/IS NOT)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: [{ value: null, matchMode: 'equals' }],
            age: [{ value: 30, matchMode: 'gte' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' WHERE age >= $1 ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual([30]);
    });

    it('should handle mix of empty and valid filters correctly', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'id';
        const sortOrder = 'DESC';
        const filters = {
            name: [{ value: '', matchMode: 'contains' }],
            status: [{ value: [], matchMode: 'in' }],
            archived: [{ value: false, matchMode: 'equals' }],
            age: [{ value: 18, matchMode: 'gte' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' WHERE archived = $1 AND age >= $2 ORDER BY id DESC LIMIT 10 OFFSET 0');
        expect(args).toEqual([false, 18]);
    });

    it('should return only ORDER BY and LIMIT when all filters have empty values', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'createdAt';
        const sortOrder = 'DESC';
        const filters = {
            name: [{ value: '', matchMode: 'contains' }],
            tags: [{ value: [], matchMode: 'in' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' ORDER BY "createdAt" DESC LIMIT 10 OFFSET 0');
        expect(args).toEqual([]);
    });

    it('should handle empty arrays in simple format (backward compatibility)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            status: { value: [], matchMode: 'in' },
            name: { value: 'John', matchMode: 'contains' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' WHERE name LIKE $1 ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual(['%John%']);
    });

    it('should handle empty strings in simple format (backward compatibility)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: '', matchMode: 'contains' },
            archived: { value: false, matchMode: 'equals' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' WHERE archived = $1 ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual([false]);
    });

});

describe('filter - multiselect', () => {
    it('should generate correct SQL filter clause for multiselect with string values (simple format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'status';
        const sortOrder = 'ASC';
        const filters = {
            status: { value: ['active', 'pending', 'approved'], matchMode: 'in' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE status IN ($1,$2,$3) ORDER BY status ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['active', 'pending', 'approved']);
    });

    it('should generate correct SQL filter clause for multiselect with number values (simple format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'id';
        const sortOrder = 'ASC';
        const filters = {
            id: { value: [1, 2, 3, 4], matchMode: 'in' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE id IN ($1,$2,$3,$4) ORDER BY id ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual([1, 2, 3, 4]);
    });

    it('should generate correct SQL filter clause for multiselect with a single value (simple format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'status';
        const sortOrder = 'ASC';
        const filters = {
            status: { value: ['active'], matchMode: 'in' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE status IN ($1) ORDER BY status ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['active']);
    });

    it('should generate correct SQL filter clause for multiselect combined with other filters (simple format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'contains' },
            status: { value: ['active', 'pending'], matchMode: 'in' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name LIKE $1 AND status IN ($2,$3) ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 'active', 'pending']);
    });

    it('should generate correct SQL filter clause for multiselect with string values (array format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'status';
        const sortOrder = 'ASC';
        const filters = {
            status: [{ value: ['active', 'pending', 'approved'], matchMode: 'in' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE status IN ($1,$2,$3) ORDER BY status ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['active', 'pending', 'approved']);
    });

    it('should generate correct SQL filter clause for multiselect combined with other filters (array format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: [{ value: 'John', matchMode: 'contains' }],
            status: [{ value: ['active', 'pending'], matchMode: 'in' }],
            archived: [{ value: false, matchMode: 'equals' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name LIKE $1 AND status IN ($2,$3) AND archived = $4 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 'active', 'pending', false]);
    });

    it('should skip multiselect filter when value is an empty array', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'status';
        const sortOrder = 'ASC';
        const filters = {
            status: [{ value: [], matchMode: 'in' }],
            archived: [{ value: false, matchMode: 'equals' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' WHERE archived = $1 ORDER BY status ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual([false]);
    });

    it('should generate correct SQL filter clause for multiselect on an uppercase column name', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'userId';
        const sortOrder = 'ASC';
        const filters = {
            userId: [{ value: [10, 20, 30], matchMode: 'in' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE "userId" IN ($1,$2,$3) ORDER BY "userId" ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual([10, 20, 30]);
    });
});

describe('filter - notIn', () => {
    it('should generate correct SQL filter clause for notIn with string values (simple format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'status';
        const sortOrder = 'ASC';
        const filters = {
            status: { value: ['deleted', 'banned'], matchMode: 'notIn' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE status NOT IN ($1,$2) ORDER BY status ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['deleted', 'banned']);
    });

    it('should generate correct SQL filter clause for notIn with number values (simple format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'id';
        const sortOrder = 'ASC';
        const filters = {
            id: { value: [5, 10, 15], matchMode: 'notIn' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE id NOT IN ($1,$2,$3) ORDER BY id ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual([5, 10, 15]);
    });

    it('should generate correct SQL filter clause for notIn with a single value (simple format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'status';
        const sortOrder = 'ASC';
        const filters = {
            status: { value: ['deleted'], matchMode: 'notIn' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE status NOT IN ($1) ORDER BY status ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['deleted']);
    });

    it('should generate correct SQL filter clause for notIn combined with other filters (simple format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: { value: 'John', matchMode: 'contains' },
            status: { value: ['deleted', 'banned'], matchMode: 'notIn' },
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name LIKE $1 AND status NOT IN ($2,$3) ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 'deleted', 'banned']);
    });

    it('should generate correct SQL filter clause for notIn with string values (array format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'status';
        const sortOrder = 'ASC';
        const filters = {
            status: [{ value: ['deleted', 'banned', 'archived'], matchMode: 'notIn' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE status NOT IN ($1,$2,$3) ORDER BY status ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['deleted', 'banned', 'archived']);
    });

    it('should generate correct SQL filter clause for notIn combined with other filters (array format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: [{ value: 'John', matchMode: 'contains' }],
            status: [{ value: ['deleted', 'banned'], matchMode: 'notIn' }],
            archived: [{ value: false, matchMode: 'equals' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE name LIKE $1 AND status NOT IN ($2,$3) AND archived = $4 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 'deleted', 'banned', false]);
    });

    it('should skip notIn filter when value is an empty array', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'status';
        const sortOrder = 'ASC';
        const filters = {
            status: [{ value: [], matchMode: 'notIn' }],
            archived: [{ value: false, matchMode: 'equals' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(' WHERE archived = $1 ORDER BY status ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual([false]);
    });

    it('should generate correct SQL filter clause for notIn on an uppercase column name', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'userId';
        const sortOrder = 'ASC';
        const filters = {
            userId: [{ value: [1, 2, 3], matchMode: 'notIn' }],
        };

        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);

        expect(filterClause).toBe(
            ' WHERE "userId" NOT IN ($1,$2,$3) ORDER BY "userId" ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual([1, 2, 3]);
    });
});

describe('filter - direct SQL comparators', () => {
    it("should handle '=' comparator directly", () => {
        const filters = { age: { value: 30, matchMode: '=' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE age = $1');
        expect(args).toEqual([30]);
    });

    it("should handle '<>' comparator directly", () => {
        const filters = { age: { value: 30, matchMode: '<>' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE age <> $1');
        expect(args).toEqual([30]);
    });

    it("should handle '<' comparator directly", () => {
        const filters = { age: { value: 18, matchMode: '<' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE age < $1');
        expect(args).toEqual([18]);
    });

    it("should handle '<=' comparator directly", () => {
        const filters = { age: { value: 65, matchMode: '<=' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE age <= $1');
        expect(args).toEqual([65]);
    });

    it("should handle '>' comparator directly", () => {
        const filters = { age: { value: 18, matchMode: '>' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE age > $1');
        expect(args).toEqual([18]);
    });

    it("should handle '>=' comparator directly", () => {
        const filters = { age: { value: 18, matchMode: '>=' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE age >= $1');
        expect(args).toEqual([18]);
    });

    it("should handle 'LIKE' comparator directly (no wildcard injection)", () => {
        const filters = { name: { value: '%John%', matchMode: 'LIKE' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE name LIKE $1');
        expect(args).toEqual(['%John%']);
    });

    it("should handle 'NOT LIKE' comparator directly (no wildcard injection)", () => {
        const filters = { name: { value: '%Admin%', matchMode: 'NOT LIKE' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE name NOT LIKE $1');
        expect(args).toEqual(['%Admin%']);
    });

    it("should handle 'IS' comparator directly with null", () => {
        const filters = { deletedAt: { value: null, matchMode: 'IS' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE "deletedAt" IS NULL');
        expect(args).toEqual([]);
    });

    it("should handle 'IS' comparator directly with false", () => {
        const filters = { locked: { value: false, matchMode: 'IS' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE locked IS FALSE');
        expect(args).toEqual([]);
    });

    it("should handle 'IS' comparator directly with true", () => {
        const filters = { locked: { value: true, matchMode: 'IS' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE locked IS TRUE');
        expect(args).toEqual([]);
    });

    it("should handle 'IS NOT' comparator directly with null", () => {
        const filters = { deletedAt: { value: null, matchMode: 'IS NOT' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE "deletedAt" IS NOT NULL');
        expect(args).toEqual([]);
    });

    it("should handle 'IS NOT' comparator directly with false", () => {
        const filters = { locked: { value: false, matchMode: 'IS NOT' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE locked IS NOT FALSE');
        expect(args).toEqual([]);
    });

    it("should handle 'IN' comparator directly", () => {
        const filters = { status: { value: ['active', 'pending'], matchMode: 'IN' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE status IN ($1,$2)');
        expect(args).toEqual(['active', 'pending']);
    });

    it("should handle 'NOT IN' comparator directly", () => {
        const filters = { status: { value: ['deleted', 'banned'], matchMode: 'NOT IN' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE status NOT IN ($1,$2)');
        expect(args).toEqual(['deleted', 'banned']);
    });

    it("should combine direct comparators with semantic match modes", () => {
        const filters = {
            name: { value: '%John%', matchMode: 'LIKE' },
            age: { value: 18, matchMode: '>=' },
            archived: [{ value: false, matchMode: 'equals' }],
        };
        const { filterClause, args } = filter(0, 10, 'name', 'ASC', filters);
        expect(filterClause).toBe(
            ' WHERE name LIKE $1 AND age >= $2 AND archived = $3 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['%John%', 18, false]);
    });

    it("should handle direct comparators in array format", () => {
        const filters = {
            age: [
                { value: 18, matchMode: '>=', operator: 'and' },
                { value: 65, matchMode: '<=', operator: 'and' },
            ],
        };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE (age >= $1 AND age <= $2)');
        expect(args).toEqual([18, 65]);
    });

    it("should handle '&&' comparator directly for array overlap", () => {
        const filters = { tags: { value: [1, 2, 3], matchMode: '&&' } };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE tags && ARRAY[$1,$2,$3]::integer[]');
        expect(args).toEqual([1, 2, 3]);
    });

    it("should handle '&&' comparator in array format for array overlap", () => {
        const filters = { tags: [{ value: [1, 2], matchMode: '&&' }] };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE tags && ARRAY[$1,$2]::integer[]');
        expect(args).toEqual([1, 2]);
    });
});

describe('filter - array overlap (&&)', () => {
    it('should generate correct SQL for && with multiple values (simple format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            tags: { value: [1, 2, 3], matchMode: '&&' },
        };
        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);
        expect(filterClause).toBe(' WHERE tags && ARRAY[$1,$2,$3]::integer[] ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual([1, 2, 3]);
    });

    it('should generate correct SQL for && with a single value (simple format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            tags: { value: [5], matchMode: '&&' },
        };
        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);
        expect(filterClause).toBe(' WHERE tags && ARRAY[$1]::integer[] ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual([5]);
    });

    it('should generate correct SQL for && combined with other filters (array format)', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            name: [{ value: 'John', matchMode: 'contains' }],
            tags: [{ value: [1, 2], matchMode: '&&' }],
        };
        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);
        expect(filterClause).toBe(' WHERE name LIKE $1 AND tags && ARRAY[$2,$3]::integer[] ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual(['%John%', 1, 2]);
    });

    it('should skip && filter when value is an empty array', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            tags: [{ value: [], matchMode: '&&' }],
            name: [{ value: 'John', matchMode: 'contains' }],
        };
        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);
        expect(filterClause).toBe(' WHERE name LIKE $1 ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual(['%John%']);
    });

    it('should generate correct SQL for && on an uppercase column name', () => {
        const first = 0;
        const rows = 10;
        const sortField = 'name';
        const sortOrder = 'ASC';
        const filters = {
            tagIds: [{ value: [10, 20], matchMode: '&&' }],
        };
        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);
        expect(filterClause).toBe(' WHERE "tagIds" && ARRAY[$1,$2]::integer[] ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual([10, 20]);
    });
});

describe('filter - top-level logical operator parameter', () => {
    it('should default to AND when operator is not provided', () => {
        const filters = {
            name: { value: 'John', matchMode: 'equals' },
            age: { value: 30, matchMode: 'equals' },
        };
        const { filterClause, args } = filter(0, null, null, null, filters);
        expect(filterClause).toBe(' WHERE name = $1 AND age = $2');
        expect(args).toEqual(['John', 30]);
    });

    it('should join top-level conditions with OR when operator is "OR"', () => {
        const filters = {
            name: { value: 'John', matchMode: 'equals' },
            age: { value: 30, matchMode: 'equals' },
        };
        const { filterClause, args } = filter(0, null, null, null, filters, 'OR');
        expect(filterClause).toBe(' WHERE name = $1 OR age = $2');
        expect(args).toEqual(['John', 30]);
    });

    it('should join top-level conditions with AND when operator is explicitly "AND"', () => {
        const filters = {
            name: { value: 'John', matchMode: 'equals' },
            age: { value: 30, matchMode: 'equals' },
        };
        const { filterClause, args } = filter(0, null, null, null, filters, 'AND');
        expect(filterClause).toBe(' WHERE name = $1 AND age = $2');
        expect(args).toEqual(['John', 30]);
    });

    it('should combine the top-level OR operator with ORDER BY and LIMIT clauses', () => {
        const filters = {
            name: { value: 'John', matchMode: 'equals' },
            age: { value: 30, matchMode: 'equals' },
        };
        const { filterClause, args } = filter(0, 10, 'name', 'ASC', filters, 'OR');
        expect(filterClause).toBe(' WHERE name = $1 OR age = $2 ORDER BY name ASC LIMIT 10 OFFSET 0');
        expect(args).toEqual(['John', 30]);
    });

    it('should not affect the per-property operator used to combine multiple filters on the same property', () => {
        const filters = {
            name: [
                { value: 'John', matchMode: 'contains', operator: 'or' },
                { value: 'Jane', matchMode: 'contains', operator: 'or' }
            ],
            age: { value: 30, matchMode: 'equals' },
        };
        const { filterClause, args } = filter(0, null, null, null, filters, 'OR');
        expect(filterClause).toBe(' WHERE (name LIKE $1 OR name LIKE $2) OR age = $3');
        expect(args).toEqual(['%John%', '%Jane%', 30]);
    });

    it('should have no effect on the filter clause when there are no conditions', () => {
        const { filterClause, args } = filter(0, null, null, null, null, 'OR');
        expect(filterClause).toBe('');
        expect(args).toEqual([]);
    });

    it('should only apply the operator to the WHERE clause, not affect ORDER BY or LIMIT clauses', () => {
        const { filterClause, args } = filter(5, 20, 'createdAt', 'DESC', null, 'OR');
        expect(filterClause).toBe(' ORDER BY "createdAt" DESC LIMIT 20 OFFSET 5');
        expect(args).toEqual([]);
    });
});