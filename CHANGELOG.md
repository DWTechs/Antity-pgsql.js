
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
