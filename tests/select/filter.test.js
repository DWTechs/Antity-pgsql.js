
import { filter } from '../../dist/antity-pgsql.js';

// Builds the where clause with given filters
// Filters should be as follow :
// filters={
//   "key1":{"value":"xxx", "matchMode":"contains"}, => string
//   "key2":{"value":[1,2], "matchMode":"contains"}, => number[]
//   "key3":{"value":true, "matchMode":"contains"},  => boolean
//   "key4":{"value":["2023-04-09T22:00:00.000Z","2023-04-12T21:59:59.000Z"],"matchMode":"between"}, => date range
//   "key5":{"value":false} => boolean,
//   "key6":{"value":1400, "subProp":"xxx"} => JsonAgg[]
//   "key7":{"value":{"2":[1,2], "3":[3]} => object[]
// };
// MatchMode is optional.
// key is the name of a column in database
// aggregate columns must have an "Agg" suffix
// Other cases may be added


// first: number,
// rows: number | null,
// sortField: string | null,
// sortOrder: Sort,
// filters: Filters | null,

describe('filter', () => {
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