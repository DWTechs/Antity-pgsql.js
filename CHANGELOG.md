# 0.20.0 (July 17th 2026)

- **Breaking:** `SQLEntity.get()` no longer reads `req.body.rows` for pagination. `req.body.rows` means "array of entities to act on" everywhere else in this class (`add`, `update`, `upsert`, `delete`, `archive`, `sync`) - reusing the same key for `get()`'s page size was error-prone (e.g. a stray `rows` array left over from a different request shape could get misread as a numeric `LIMIT`, producing invalid SQL). Page size is now exclusively `req.body.limit` (a number). Callers relying on `{ rows: <number> }` for pagination must switch to `{ limit: <number> }`.
- Renamed the internal/public `rows` parameter to `limit` in `Select.query()`, the exported `filter()` function, and `SQLEntity.query.select()` for clarity, matching the `req.body.limit` field name above - purely a parameter rename (still positional), no behavior change for those.
- Fix `addOneSubstack`/`updateOneSubstack`/`upsertOneSubstack`: `normalizeOne`/`validateOne` (from `@dwtechs/antity`) operate directly on `req.body` as the single entity object with no `rows` wrapper, but `add()`/`update()`/`upsert()` unconditionally read `req.body.rows`, which doesn't exist in that shape - calling any `*OneSubstack` crashed (`rows.map`/`chunk` on `undefined`). Added a `resolveRows()` helper so `add()`/`update()`/`upsert()` now accept either `req.body.rows` (array, Array substacks) or `req.body` itself (single object, One substacks), and return a clean `400` instead of crashing when neither shape is present or `req.body.rows` is an invalid (non-array) value.

# 0.19.1 (July 16th 2026)

- Fix `"is"`/`"isNot"`/`"IS"`/`"IS NOT"` match modes generating an invalid bound parameter (`col IS $n`) when the filter value is `null`, `true` or `false`. PostgreSQL's `IS` operator only accepts the `NULL`/`TRUE`/`FALSE`/`UNKNOWN` keywords, never a `$n` placeholder. These comparisons now inline the literal directly (`col IS NULL` / `col IS NOT NULL` / `col IS TRUE` / `col IS NOT FALSE`, etc.) and no longer consume a placeholder index or push a value into `args`. Non-literal usage of `"is"`/`"isNot"` (e.g. against strings) is unchanged.
- `SQLEntity.delete` now falls back to a single `req.params.id` (e.g. a `DELETE /resource/:id` route) when `req.body.rows` is missing or empty, instead of throwing on `rows.map(...)` of `undefined`. `req.body.rows` still takes priority when present (bulk delete via body, e.g. `DELETE /resource`). Calling `delete` with neither now returns `next({ status: 400, message: "Missing rows in req.body or id in req.params for delete operation" })` instead of crashing.

# 0.19.0 (July 15th 2026)

- Add `operator` parameter (`"AND" | "OR"`, defaults to `"AND"`) to control how top-level filter properties are combined in the generated `WHERE` clause:
  - `filter()` now accepts an optional 6th `operator` argument
  - `query.select()` now accepts an optional 6th `operator` argument
  - `get()` middleware now reads `operator` from `req.body.operator`, falling back to `"AND"` for missing or invalid values

# 0.18.3 (July 4th 2026)

- Declare package as ESM-only by adding `"type": "module"` and an `"exports"` map to `package.json`

# 0.18.2 (July 3rd 2026)

- Update dependencies:
  - "@dwtechs/checkard": "3.6.1",
  - "@dwtechs/winstan": "0.7.1",
  - "@dwtechs/antity": "0.18.1"

# 0.18.1 (June 6th 2026)

- Add `::numeric[]`, `::boolean[]` and `::varchar[]` type casts to `ARRAY[...]` in the `&&` (overlap) operator depending on the filter value type

# 0.18.0 (June 5th 2026)

- **Breaking:** rename `msg` to `message` in all error objects passed to Express `next()` or thrown, aligning with the standard `Error.message` convention

# 0.17.7 (June 4th 2026)

- Add `::integer[]` type cast to `ARRAY[...]` in the `&&` (overlap) operator when the filter value is an array of integers

# 0.17.6 (May 31st 2026)

- Add support for PostgreSQL array overlap operator (`&&`) on `array`-typed properties:
  - `"in"` matchMode is automatically converted to `"&&"` in `cleanFilters()` when the property type is `"array"`
  - `mapIndexes()` now wraps indexes in `ARRAY[...]` for the `"&&"` matchMode, generating `column && ARRAY[$1,$2]`
  - `mapComparator()` now returns `"&&"` for the `"&&"` matchMode
  - `"&&"` added to `Comparator` type and `COMPARATORS` set
  - `"array"` added to `MappedType`; `map.type()` now maps entity type `"array"` to `"array"`
  - `check.matchMode()` now validates `"&&"` as the only allowed matchMode for `array`-typed properties

# 0.17.5 (May 28th 2026)

- Update dependencies:
  - "@dwtechs/antity": "0.18.0"
- Security: fix SQL injection via identifier manipulation in `quoteIfUppercase()` — internal double-quote characters are now escaped by doubling them (`"` → `""`) before wrapping in double quotes
- Security: `sortField` is now validated against the entity's known properties in both the `get()` middleware and `query.select()` before use in `ORDER BY`; an unrecognised field is silently dropped to prevent arbitrary column names reaching the query
- Performance: replace string concatenation in loops with array + `join()` in `Insert.query()`, `Update.query()`, and `Upsert.query()` for faster bulk query generation

# 0.17.4 (May 08th 2026)

- Update dependencies:
  - "@dwtechs/winstan": "0.7.0"

# 0.17.3 (Apr 18th 2026)

- Add support for direct SQL comparators (`=`, `<`, `>`, `<=`, `>=`, `<>`, `IS`, `IS NOT`, `IN`, `NOT IN`, `LIKE`, `NOT LIKE`) as valid `matchMode` values in `Filter`
  - `mapComparator()` now passes through direct comparators without mapping
  - `mapIndexes()` now wraps indexes in parentheses for `IN` and `NOT IN` comparators
  - `shouldSkipValue()` now allows `null` values for `IS` and `IS NOT` comparators
  - `check.matchMode()` now accepts direct comparators as valid for all property types

# 0.17.2 (Apr 18th 2026)

- Fix audit column names for consumer nickname in generated SQL queries:
  - INSERT queries (`query.insert()`, `query.upsert()`) now write `consumer.nickname` into `creatorName` instead of `name`
  - UPDATE queries (`query.update()`, `query.archive()`) now write `consumer.nickname` into `updaterName` instead of `name`
- Add double quotes around audit column names `creatorId`, `creatorName`, `updaterId`, `updaterName` in generated SQL queries to preserve camelCase

# 0.17.1 (Apr 17th 2026)

- Fix audit column names to use camelCase in generated SQL queries:
  - INSERT queries (`query.insert()`, `query.upsert()`) now write into `creatorId` instead of `creatorid`
  - UPDATE queries (`query.update()`, `query.archive()`) now write into `updaterId` instead of `updaterid`

# 0.17.0 (Apr 16th 2026)

- Rename audit columns in INSERT and UPDATE queries to match database conventions:
  - INSERT queries (`query.insert()`, `query.upsert()`) now write `consumer.id` into `creatorid` and `consumer.nickname` into `name` instead of `"consumerId"` / `"consumerName"`
  - UPDATE queries (`query.update()`, `query.archive()`) now write `consumer.id` into `updaterid` and `consumer.nickname` into `name` instead of `"consumerId"` / `"consumerName"`

# 0.16.0 (Apr 08th 2026)

- Replace separate `consumerId` / `consumerName` parameters with a single `consumer` object (`{ id?, nickname? }`) across all relevant APIs:
  - `query.update()`, `query.insert()`, `query.upsert()`, `query.archive()` now accept `consumer?: { id?: number | string, nickname?: string }` instead of two separate arguments
  - Express middlewares (`add`, `update`, `upsert`, `archive`, `sync`) now read `res.locals.consumer.id` and `res.locals.consumer.nickname` instead of `res.locals.consumerId` / `res.locals.consumerName`

# 0.15.2 (Mar 26th 2026)

- Fix `notIn` match mode not working in filter SQL generation:
- Add `"in"` and `"notIn"` to allowed match modes for `number`and `string`

# 0.15.1 (Mar 25th 2026)

- Fix filter handling to exclude empty values from WHERE clauses:
  - Filters with empty string values are now skipped
  - Filters with empty arrays are now skipped
  - Filters with null values are skipped except for `is` and `isNot` match modes

# 0.15.0 (Mar 23th 2026)

- Add bulk sync functionality:
  - New `sync()` Express middleware atomically synchronises a table with the full provided row list inside a single PostgreSQL transaction (BEGIN / COMMIT / ROLLBACK on failure)
  - Incoming rows without an ID (or with an unknown ID) are **inserted**; rows with a known ID are **updated**; existing rows absent from the list are **deleted**
  - Accepts optional `idField` in request body (defaults to `'id'`) to specify the identity column
  - Accepts optional `filters` in request body to scope the managed set — rows outside the filter are never touched
  - Returns synced rows with generated IDs in `res.locals.rows`
  - Returns operation summary `{ inserted, updated, deleted }` in `res.locals.sync`
  - Supports `consumerId` / `consumerName` forwarding for history tracking on inserts and updates
- Add `syncArraySubstack` getter returning `[normalizeArray, validateArray, sync]` middleware chain

# 0.14.0 (Mar 22nd 2026)

- Add UPSERT functionality using PostgreSQL's `INSERT ... ON CONFLICT ... DO UPDATE` syntax:
  - New `query.upsert()` method generates upsert queries with configurable conflict targets
  - Supports single or multiple column conflict targets (e.g., `'id'` or `['email', 'username']`)
  - Properties with both `INSERT` and `UPDATE` operations are automatically included in upsert
  - Supports `consumerId` and `consumerName` for history tracking
  - Supports `RETURNING` clause to retrieve updated/inserted row IDs
- Add `upsert()` Express middleware for handling upsert operations:
  - Expects `rows` and `conflictTarget` in request body
  - Returns upserted rows with IDs in `res.locals.rows`
  - Supports chunking for bulk operations
- Add convenience Express substack middlewares:
  - `upsertArraySubstack`: Returns `[normalizeArray, validateArray, upsert]` middleware chain
  - `upsertOneSubstack`: Returns `[normalizeOne, validateOne, upsert]` middleware chain

# 0.13.0 (Mar 17th 2026)

- Add dedicated `Archive` query :
  - Replaces the previous approach of passing `archived: true` through the generic `Update` query
  - Generates a simplified `UPDATE ... SET archived = true WHERE id IN (...)` query directly
  - Optionally appends `consumerId` and `consumerName` as single scalar values (not per-row CASE blocks)
- Add `query.archive()` method to `SQLEntity` using the new `Archive` class
- Add `properties` getter to `SQLEntity` returning the list of `Property` instances passed at construction

# 0.12.0 (Mar 15th 2026)

- `update` middleware now forwards sanitized and normalized rows to `res.locals.rows` for use in subsequent middlewares and response handling. Like `add` and `get` middlewares

# 0.11.1 (Mar 14th 2026)

- Fix wildcard placement in LIKE queries:
  - Wildcards (%) are now added to string values instead of SQL parameter placeholders
  - Affects matchModes: `startsWith`, `endsWith`, `contains`, `notContains`
  - SQL now generates `LIKE $1` with value `'%abc%'` instead of `LIKE %$1%` with value `'abc'`

# 0.11.0 (Mar 13th 2026)

- Add support for array-based filter format with multiple filters per property:
  - Filters now accept both simple format (single object) and complex format (array of objects)
  - Simple format: `{name: {value: "John", matchMode: "contains"}}` (backward compatible)
  - Complex format: `{name: [{value: "John", matchMode: "contains", operator: "or"}]}` (new)
  - Support logical operators (AND/OR) to combine multiple filters on the same property
  - Example: `{name: [{value: "John", operator: "or"}, {value: "Jane", operator: "or"}]}`
- Fix `isFilterable` property in declaration file

# 0.10.0 (Mar 11th 2026)

- Rename Property interface properties for better clarity and consistency:
  - `typeCheck` → `isTypeChecked`: Boolean flag to enable/disable type checking
  - `filter` → `isFilterable`: Boolean flag to enable/disable filtering in SELECT operations
  - `need` → `requiredFor`: Array of REST methods (POST, PUT, PATCH) that require this property
  - `send` → `isPrivate`: Boolean flag inverted - `send: true` becomes `isPrivate: false`
- Rename entity getter method:
  - `unsafeProps` → `privateProps`: Returns array of property names that are private
- Update dependencies:
  - "@dwtechs/antity": "0.16.0"

# 0.9.1 (Mar 3th 2026)

- Fix TypeScript type definitions in antity-pgsql.d.ts:
  - Remove DELETE from Operation type (now "SELECT" | "INSERT" | "UPDATE")
  - Replace `any` types with proper TypeScript types (`Pool | PoolClient | null`, `unknown`)
  - Add proper Property class declaration extending BaseProperty from @dwtechs/antity
  - Improve import statements for better type safety

# 0.9.0 (Mar 1st 2026)

- add schema parameter to entity constructor to support multiple schemas in the same database 
- Update Property interface to align with @dwtechs/antity 0.15.0
  - Remove `methods` property (REST methods like GET, POST, PUT, DELETE)
  - Remove `required` boolean property
  - Remove `safe` boolean property  
  - Remove `sanitize` boolean property
  - Remove `normalize` boolean property
  - Remove `validate` boolean property
  - Add `need` property: array of REST methods (POST, PUT, PATCH) that require this property in request body
  - Add `send` property: boolean to indicate if property should be sent in response
- Add convenience express substack middlewares :
  - `addArraySubstack`: Returns [normalizeArray, validateArray, add] middleware chain
  - `addOneSubstack`: Returns [normalizeOne, validateOne, add] middleware chain
  - `updateArraySubstack`: Returns [normalizeArray, validateArray, update] middleware chain
  - `updateOneSubstack`: Returns [normalizeOne, validateOne, update] middleware chain
- change `queryArchived` function name to `queryByDate` to better reflect its purpose of generating queries for deleting archived rows based on a date condition 
  - `queryByDate` function now generates a query that uses a hard_delete() function in postgreSQL in order to delete rows and their history in a single query 
- Add history getter to entity that generates a query to retrieve the history of changes for a specific row based on its ID
- Update dependencies:
  - "@dwtechs/antity": "0.15.0"

# 0.8.1 (Feb 21th 2026)

- Fix UPDATE query to include ELSE clauses in CASE statements

# 0.8.0 (Feb 16th 2026)

- Delete "paginate" property from query function
- The total row count is now automatically included when pagination parameters (first/rows) are provided

# 0.7.0 (Jan 1st 2026)

- Rename delete() method to deleteArchive() for deleting archived rows before a specific date
- Add new delete() method that deletes rows by their IDs using a single database request
- Add query.delete(ids: number[]) method that generates DELETE queries using PostgreSQL's ANY operator
- Add query.deleteArchive() method that generates DELETE queries for archived rows

# 0.6.2 (Dec 31st 2025)

- Fix INSERT RETURNING clause to properly apply quoting logic for property names with uppercase letters or reserved keywords

# 0.6.1 (Dec 27th 2025)

- Fix UPDATE query to properly apply quoting logic to fields that contain uppercase letters

# 0.6.0 (Dec 20th 2025)

- Update dependencies : 
  - "@dwtechs/antity": "0.14.0"

# 0.5.1 (Dec 14th 2025)

- Fix INSERT query bug where property values were null due to accessing row data with quoted property names instead of original names

# 0.5.0 (Dec 13th 2025)

- Make consumerId and consumerName optional parameters in INSERT and UPDATE operations
- Fix declaration file for query.select() function

# 0.4.0 (Sep 26th 2025)
  
- Add filter property to make a property filterable in SELECT operations
- Add Operations property to list SQL DML operations available for the property
- Enhance usability with automatic summary logging during entity creation with tree-structured entity summary output showing properties, operations, and CRUD mappings
- Update query.select() method to support filtering instead of creating filters externally. 
- Update dependencies : 
  - "@dwtechs/antity": "0.13.0"
  - "@dwtechs/winstan": "0.5.0"
  - "@dwtechs/checkard": "3.6.0"

# 0.3.4 (Sep 10th 2025)
  
- Update dependencies : 
  - "@dwtechs/checkard": "3.5.1",
  - "@dwtechs/antity": "0.11.2",
  - "@dwtechs/sparray": "0.2.1",


# 0.3.3 (Aug 16th 2025)

- Improved error handling in entity operations
- Update Antity.js to version 0.11.1


# 0.3.2 (May 2nd 2025)

- Upgrade @dwtechs/antity dependency to 0.10.0


# 0.3.1 (May 1st 2025)

- Upgrade @dwtechs/antity dependency to 0.9.2


# 0.3.0 (Apr 27th 2025)

- Enhance quote handling for reserved keywords


# 0.2.1 (Apr 26th 2025)

- Add proper quote handling for table names


# 0.2.0 (Apr 25th 2025)

- Add execute() method to the library
- Add quotes around property names with uppercases


# 0.1.1 (Apr 24th 2025)

- fix package.json file


# 0.1.0 (Apr 23th 2025)

- initial release
