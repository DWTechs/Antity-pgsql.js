
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
            ' WHERE name LIKE $1% AND age >= $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 30]);
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
            ' WHERE name LIKE %$1 AND age <= $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 30]);
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
            ' WHERE name LIKE %$1% AND age > $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 29]);
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
            ' WHERE name NOT LIKE %$1% AND age < $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 31]);
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
            ' WHERE name NOT LIKE %$1% AND age = $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 30]);
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
            ' WHERE name NOT LIKE %$1% AND age <> $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 31]);
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
            ' WHERE name NOT LIKE %$1% AND age IN ($2,$3,$4) ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 30, 31, 32]);
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
            ' WHERE name LIKE %$1% AND archived = $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', false]);
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
            ' WHERE (name LIKE %$1% OR name LIKE %$2%) ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 'Jane']);
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
            ' WHERE (name LIKE %$1% OR name LIKE %$2%) AND archived = $3 AND age >= $4 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 'Jane', false, 18]);
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
            ' WHERE (name LIKE $1% OR name LIKE %$2) ORDER BY name DESC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 'Doe']);
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
            ' WHERE name NOT LIKE %$1% AND status <> $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['Admin', 'deleted']);
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
            ' WHERE name LIKE %$1% AND age >= $2 AND archived = $3 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual(['John', 30, false]);
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
            ' WHERE "deletedAt" IS $1 AND "archivedAt" IS NOT $2 ORDER BY name ASC LIMIT 10 OFFSET 0'
        );
        expect(args).toEqual([null, null]);
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

});