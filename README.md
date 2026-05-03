
[![License: MIT](https://img.shields.io/npm/l/@dwtechs/antity-pgsql.svg?color=brightgreen)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40dwtechs%2Fantity-pgsql.svg)](https://www.npmjs.com/package/@dwtechs/antity-pgsql)
[![last version release date](https://img.shields.io/github/release-date/DWTechs/Antity-pgsql.js)](https://www.npmjs.com/package/@dwtechs/antity-pgsql)
![Jest:coverage](https://img.shields.io/badge/Jest:coverage-87%25-brightgreen.svg)

- [Synopsis](#synopsis)
- [Support](#support)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Contributors](#contributors)
- [Stack](#stack)


## Synopsis

**[Antity-pgsql.js](https://github.com/DWTechs/Antity-pgsql.js)** adds PostgreSQL features to **Antity.js** library.

- 🪶 Very lightweight
- 🧪 Thoroughly tested
- 🚚 Shipped as EcmaScrypt module
- 📝 Written in Typescript

## Installation

```bash
$ npm i @dwtechs/antity-pgsql
```

## Usage

```javascript

import { SQLEntity } from "@dwtechs/antity-pgsql";
import { normalizeName, normalizeNickname } from "@dwtechs/checkard";

// Create entity with default 'public' schema
const entity = new SQLEntity("consumers", [
  // properties...
]);

// Or specify a custom schema
const customEntity = new SQLEntity("consumers", [
  // properties...
], "myschema");

// Example with all properties
const entity = new SQLEntity("consumers", [
  {
    key: "id",
    type: "integer",
    min: 0,
    max: 120,
    isTypeChecked: true,
    isFilterable: true,
    requiredFor: ["PUT"],
    operations: ["SELECT", "UPDATE"],
    isPrivate: false,
    sanitizer: null,
    normalizer: null,
    validator: null,
  },
  {
    key: "firstName",
    type: "string",
    min: 0,
    max: 255,
    isTypeChecked: true,
    isFilterable: false,
    requiredFor: ["POST", "PUT"],
    operations: ["SELECT", "UPDATE"],
    isPrivate: false,
    sanitizer: null,
    normalizer: normalizeName,
    validator: null,
  },
  {
    key: "lastName",
    type: "string",
    min: 0,
    max: 255,
    isTypeChecked: true,
    isFilterable: false,
    requiredFor: ["POST", "PUT"],
    operations: ["SELECT", "UPDATE"],
    isPrivate: false,
    sanitizer: null,
    normalizer: normalizeName,
    validator: null,
  },
  {
    key: "nickname",
    type: "string",
    min: 0,
    max: 255,
    isTypeChecked: true,
    isFilterable: true,
    requiredFor: ["POST", "PUT"],
    operations: ["SELECT", "UPDATE"],
    isPrivate: false,
    sanitizer: null,
    normalizer: normalizeNickname,
    validator: null,
  },
]);

router.get("/", ..., entity.get);

// Using substacks (recommended) - combines normalize, validate, and database operation
router.post("/", ...entity.addArraySubstack);
router.put("/", ...entity.updateArraySubstack);
router.put("/preferences", ...entity.syncArraySubstack);

// Or manually chain middlewares
router.post("/manual", entity.normalizeArray, entity.validateArray, ..., entity.add);
router.put("/manual", entity.normalizeArray, entity.validateArray, ..., entity.update);

router.patch("/archive", ..., entity.archive);
router.delete("/", ..., entity.delete);
router.delete("/archived", ..., entity.deleteArchive);
router.get("/:id/history", ..., entity.getHistory);

```

### Expected table structure

```sql
CREATE TABLE IF NOT EXISTS "service" (
  id SERIAL PRIMARY KEY,
  name varchar(20) NOT NULL,
  pattern TEXT,
  archived BOOLEAN DEFAULT FALSE,
  "archivedAt" TIMESTAMP,
  "creatorId" INT,
  "creatorName" TEXT,
  "updaterId" INT,
  "updaterName" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP NULL
);
```

## API Reference


```javascript

type Operation = "SELECT" | "INSERT" | "UPDATE";

type Row = Record<string, string | number | boolean | Date | number[]>;

type Comparator =
  "=" | "<" | ">" | "<=" | ">=" | "<>" |
  "IS" | "IS NOT" | "IN" | "NOT IN" | "LIKE" | "NOT LIKE";

type MatchMode =  
  "startsWith" | 
  "endsWith" |
  "contains" |
  "notContains" |
  "equals" |
  "notEquals" |
  "between" |
  "in" |
  "notIn" |
  "lt" |
  "lte" |
  "gt" |
  "gte" |
  "is" |
  "isNot" |
  "before" |
  "after" |
  "st_contains" |
  "st_dwithin" |
  Comparator; // direct SQL comparators are also accepted


type Filters = {
  [key: string]: Filter | Filter[]; // Supports both simple (object) and complex (array) formats
}

type Filter = {
  value: string | number | boolean | Date | number[];
  matchMode?: MatchMode; // semantic mode or direct SQL comparator
  operator?: string; // 'and' | 'or' - Used when multiple filters apply to the same property
}

type PGClient = {
  query(text: string, values?: unknown[]): Promise<PGResponse>;
};

type PGResponse = {
  rows: Record<string, unknown>[];
  rowCount: number | null;
  total?: number;
};

type SelectResponse = {
  rows: Record<string, unknown>[];
  total?: number;
};

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;
type ExpressMiddlewareAsync = (req: Request, res: Response, next: NextFunction) => Promise<void>;
type SubstackTuple = [ExpressMiddleware, ExpressMiddleware, ExpressMiddlewareAsync];

class SQLEntity {
  constructor(name: string, properties: Property[], schema?: string);
  get name(): string;
  get table(): string;
  get schema(): string;
  get privateProps(): string[];
  get properties(): Property[];
  set name(name: string);
  set table(table: string);
  set schema(schema: string);

  // Middleware substacks (combine normalize, validate, and operation)
  get addArraySubstack(): SubstackTuple;
  get addOneSubstack(): SubstackTuple;
  get updateArraySubstack(): SubstackTuple;
  get updateOneSubstack(): SubstackTuple;
  get upsertArraySubstack(): SubstackTuple;
  get upsertOneSubstack(): SubstackTuple;
  get syncArraySubstack(): SubstackTuple;

  query: {
    select: (
      first?: number,
      rows?: number | null,
      sortField?: string | null,
      sortOrder?: "ASC" | "DESC" | null,
      filters?: Filters | null) => {
        query: string;
        args: (Filter["value"])[];
      };
    update: (
      rows: Row[],
      consumer?: { id?: number | string, nickname?: string }) => {
        query: string;
        args: unknown[];
    };
    archive: (
      rows: Row[],
      consumer?: { id?: number | string, nickname?: string }) => {
        query: string;
        args: unknown[];
    };
    insert: (
      rows: Row[],
      consumer?: { id?: number | string, nickname?: string },
      rtn?: string) => {
        query: string;
          args: unknown[];
      };
    upsert: (
      rows: Row[],
      conflictTarget: string | string[],
      consumer?: { id?: number | string, nickname?: string },
      rtn?: string) => {
        query: string;
        args: unknown[];
      };
    delete: (ids: number[]) => {
      query: string;
      args: number[];
    };
    deleteArchive: () => string;
    return: (prop: string) => string;
  };
  get: (req: Request, res: Response, next: NextFunction) => void;
  add: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  upsert: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  sync: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  archive: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteArchive: (req: Request, res: Response, next: NextFunction) => void;
  getHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;

}

function filter(
  first: number,
  rows: number | null,
  sortField: string | null,
  sortOrder: Sort | null,
  filters: Filters | null,
): { filterClause: string, args: (Filter["value"])[] };

function execute(
  query: string, 
  args: (string | number | boolean | Date | number[])[], 
  client: PGClient | null,
): Promise<PGResponse>;


```

### Middleware Methods for Express.js

get(), add(), update(), upsert(), sync(), archive(), delete(), deleteArchive() and getHistory() methods are made to be used as Express.js middlewares.
Each method will look for data to work on in the **req.body.rows** parameter.

The upsert() method additionally requires **req.body.conflictTarget** to specify which column(s) define uniqueness.

The sync() method accepts an optional **req.body.idField** (defaults to `'id'`) and optional **req.body.filters** to scope which existing rows are considered part of the managed set.

### Schema Qualification

All SQL queries generated by Antity-pgsql use schema-qualified table names (e.g., `schema.table`). This provides:
- **Security**: Protection against search_path manipulation attacks, especially important when using SECURITY DEFINER functions
- **Clarity**: Explicit schema references make queries more readable and maintainable
- **Flexibility**: Easy multi-schema support within the same application

The default schema is `'public'` but can be customized via the constructor's third parameter or the `schema` setter.

### Middleware Substacks

Substacks are pre-composed middleware chains that combine normalization, validation, and database operations:

- **addArraySubstack**: Combines `normalizeArray`, `validateArray`, and `add`. Use this for POST routes with `req.body.rows` containing multiple objects.
- **addOneSubstack**: Combines `normalizeOne`, `validateOne`, and `add`. Use this for POST routes with `req.body` containing a single object.
- **updateArraySubstack**: Combines `normalizeArray`, `validateArray`, and `update`. Use this for PUT routes with `req.body.rows` containing multiple objects.
- **updateOneSubstack**: Combines `normalizeOne`, `validateOne`, and `update`. Use this for PUT routes with `req.body` containing a single object.
- **upsertArraySubstack**: Combines `normalizeArray`, `validateArray`, and `upsert`. Use this for upsert routes with `req.body.rows` containing multiple objects. Requires `req.body.conflictTarget`.
- **upsertOneSubstack**: Combines `normalizeOne`, `validateOne`, and `upsert`. Use this for upsert routes with `req.body` containing a single object. Requires `req.body.conflictTarget`.
- **syncArraySubstack**: Combines `normalizeArray`, `validateArray`, and `sync`. Use this for bulk-sync routes with `req.body.rows` containing the full desired state. Rows are inserted, updated, or deleted as needed. Accepts optional `req.body.idField` and `req.body.filters`.

Using substacks simplifies your route definitions and ensures consistent data processing.

### Query Methods

- **query.select()**: Generates a SELECT query. When the `rows` parameter is provided (not null), pagination is automatically enabled and the query includes `COUNT(*) OVER () AS total` to return the total number of rows. The total count is extracted from results and returned separately from the row data.
- **query.insert()**: Generates an INSERT query. Accepts an array of `Row` objects with properties matching the entity definition. Consumer fields are appended directly to the query arguments — row objects are **not mutated**. Optionally appends `consumer.id` as `creatorId` and `consumer.nickname` as `creatorName` for audit tracking. Supports `RETURNING` clause via the `rtn` parameter.
- **query.update()**: Generates an UPDATE query using CASE statements. Accepts an array of `Row` objects with `id` property. Optionally appends `consumer.id` as `updaterId` and `consumer.nickname` as `updaterName` for audit tracking.
- **query.upsert()**: Generates an INSERT ... ON CONFLICT ... DO UPDATE query. (See [Upsert](#upsert-insert-or-update) section below.) Accepts an array of `Row` objects and a `conflictTarget` (single column name or array of column names) that defines uniqueness. If a conflict occurs on the specified column(s), the row is updated; otherwise, it is inserted. Properties are automatically included if they have both INSERT and UPDATE operations. Consumer fields are appended directly to the query arguments — row objects are **not mutated**. Optionally appends `consumer.id` as `creatorId` and `consumer.nickname` as `creatorName` for audit tracking. Supports `RETURNING` clause via the `rtn` parameter.
- **query.archive()**: Generates a simplified `UPDATE ... SET archived = true WHERE id IN (...)` query. Accepts an array of `Row` objects with `id` property. Optionally appends `consumer.id` as `updaterId` and `consumer.nickname` as `updaterName` for audit tracking. Does not require an `archived` field in the rows — it is set directly in the SQL.
- **sync()**: Atomically synchronises the table with the provided rows inside a single PostgreSQL transaction. Missing rows are inserted, existing rows are updated, and rows absent from the list are deleted. Accepts optional `idField` (default `'id'`) and `filters` to restrict the scope of managed rows. Stores the result in `res.locals.rows` and a summary `{ inserted, updated, deleted }` in `res.locals.sync`.
- **delete()**: Deletes rows by their IDs. Expects `req.body.rows` to be an array of objects with `id` property: `[{id: 1}, {id: 2}]`
- **deleteArchive()**: Deletes archived rows that were archived before a specific date using a PostgreSQL SECURITY DEFINER function. Expects `req.body.date` to be a Date object.
- **getHistory()**: Retrieves modification history for rows from the `log.history` table. Expects `req.body.rows` to be an array of objects with `id` property. Returns all historical records for the specified entity IDs.

### Bulk Sync

The sync functionality atomically replaces the managed set of rows in a table with the supplied list. It combines insert, update, and delete in a single PostgreSQL **transaction** — either all changes succeed or none do.

#### How It Works

1. **Fetch existing IDs**: A `SELECT id FROM table` is issued, optionally scoped by `filters`.
2. **Diff**: Incoming rows without an ID (or with an unknown ID) are inserted; rows with a known ID are updated; existing IDs absent from the incoming list are deleted — all within the same filter scope.
3. **Transaction**: All three operations run inside `BEGIN` / `COMMIT`. A failure at any step triggers `ROLLBACK`.
4. **Result**: `res.locals.rows` contains the full synced list (with generated IDs filled in for inserts). `res.locals.sync` contains `{ inserted, updated, deleted }` counts.

#### Usage Examples

**Using the middleware:**

```javascript
// Route definition
router.put('/users/sync', ...entity.syncArraySubstack);

// Request body — send the entire desired state
{
  rows: [
    { id: 1, name: 'John Updated', email: 'john@example.com', age: 31 }, // update
    { name: 'Jane New', email: 'jane@example.com', age: 25 }             // insert
    // id: 2 is absent → will be deleted
  ],
  idField: 'id' // optional, defaults to 'id'
}
```

**Scoping with filters (only manage a subset of rows):**

```javascript
// Only sync rows where age >= 18 — rows outside this filter are left untouched
{
  rows: [
    { id: 1, name: 'John', email: 'john@example.com', age: 30 }
  ],
  filters: {
    age: { value: 18, matchMode: 'gte' }
  }
}
```

**Response locals after sync:**

```javascript
res.locals.rows  // full list of synced rows (inserts have their new id)
res.locals.sync  // { inserted: 1, updated: 1, deleted: 1 }
```

#### Important Notes

- **Atomic**: All insert / update / delete operations are wrapped in a single transaction.
- **Filter scope**: When `filters` are provided, only rows matching the filter are considered "managed". Rows outside the filter are never touched.
- **Property selection**: Insert uses `INSERT` properties; update uses `UPDATE` properties — same as the standalone `add` and `update` middlewares.
- **Consumer tracking**: `consumer.id` and `consumer.nickname` from `res.locals.consumer` are forwarded to inserts as `creatorId`/`creatorName` and to updates as `updaterId`/`updaterName` for audit tracking.

### Upsert (Insert or Update)

The upsert functionality uses PostgreSQL's `INSERT ... ON CONFLICT ... DO UPDATE` syntax to insert rows or update them if they already exist based on a unique constraint.

#### How It Works

1. **Conflict Target**: You specify which column(s) define uniqueness (e.g., `'id'`, `'email'`, or `['name', 'email']`)
2. **Property Selection**: Properties are automatically included if they have **both** `INSERT` and `UPDATE` in their `operations` array
3. **On Conflict**: When a conflict occurs, all columns except the conflict target are updated

#### Usage Examples

**Using the middleware with a single conflict target:**

```javascript
// Route definition
router.post('/users/upsert', ...entity.upsertArraySubstack);

// Request body
{
  rows: [
    { id: 1, name: 'John Updated', email: 'john@example.com' },
    { name: 'Jane New', email: 'jane@example.com' }
  ],
  conflictTarget: 'id'
}
```

**Using email as conflict target:**

```javascript
// If a user with this email exists, update their name; otherwise, insert
{
  rows: [
    { name: 'John', email: 'john@example.com', age: 30 }
  ],
  conflictTarget: 'email'
}
```

**Using multiple columns as conflict target:**

```javascript
// Unique constraint on combination of name and email
{
  rows: [
    { name: 'John', email: 'john@example.com', age: 30 }
  ],
  conflictTarget: ['name', 'email']
}
```

**Using the query generator directly:**

```javascript
const { query, args } = entity.query.upsert(
  [{ id: 1, name: 'John', email: 'john@example.com' }],
  'id',
  { id: 1, nickname: 'admin' }, // consumer (optional)
  'RETURNING id' // return clause (optional)
);
// Generates:
// INSERT INTO public.users (name, email, creatorId, name)
// VALUES ($1, $2, $3, $4)
// ON CONFLICT (id) DO UPDATE SET 
//   name = EXCLUDED.name,
//   email = EXCLUDED.email,
//   creatorId = EXCLUDED.creatorId,
//   name = EXCLUDED.name
// RETURNING id
```

#### Property Configuration for Upsert

Properties are automatically included in upsert if they have both INSERT and UPDATE operations:

```javascript
{
  key: 'name',
  operations: ['SELECT', 'INSERT', 'UPDATE'] // Included in upsert
}

{
  key: 'id',
  operations: ['SELECT', 'UPDATE'] // NOT included (no INSERT)
}

{
  key: 'createdAt',
  operations: ['SELECT', 'INSERT'] // NOT included (no UPDATE)
}
```

#### Important Notes

- **Conflict Target Required**: The `conflictTarget` parameter must specify an existing unique constraint or primary key
- **Mixed Rows**: You can upsert rows with and without IDs in the same request if your conflict target handles it (e.g., using `SERIAL` primary key)
- **Atomic Operation**: Unlike separate insert/update calls, upsert is a single atomic database operation
- **Concurrent Safety**: Prevents race conditions when multiple requests try to create the same record

### Filters

Filters support two formats for maximum flexibility:

#### Simple Format (Single Filter per Property)

Backward-compatible format using a single filter object:

```javascript
const filters = {
  name: { value: 'John', matchMode: 'contains' },
  age: { value: 30, matchMode: 'equals' },
  archived: { value: false, matchMode: 'equals' }
};

// Direct SQL comparators are also accepted
const filters = {
  age: { value: 30, matchMode: '>=' },
  status: { value: null, matchMode: 'IS NOT' }
};
```

#### Complex Format (Multiple Filters per Property)

Array-based format supporting multiple filters with logical operators:

```javascript
const filters = {
  // Multiple filters on the same property with OR operator
  name: [
    { value: 'John', matchMode: 'contains', operator: 'or' },
    { value: 'Jane', matchMode: 'contains', operator: 'or' }
  ],
  // Age range with AND operator
  age: [
    { value: 18, matchMode: 'gte', operator: 'and' },
    { value: 65, matchMode: 'lte', operator: 'and' }
  ],
  // Single filter in array format
  archived: [{ value: false, matchMode: 'equals' }]
};
```

This generates SQL like:
```sql
WHERE (name LIKE '%John%' OR name LIKE '%Jane%') 
  AND (age >= 18 AND age <= 65) 
  AND archived = false
```

**Notes:**
- Both formats can be mixed in the same filters object
- When using arrays with a single filter, the operator is optional
- Default operator is 'AND' if not specified
- The operator field is case-insensitive


## Match modes

`matchMode` accepts either a **semantic match mode** (listed below) or a **direct SQL comparator** (`=`, `<`, `>`, `<=`, `>=`, `<>`, `IS`, `IS NOT`, `IN`, `NOT IN`, `LIKE`, `NOT LIKE`).

Using a direct comparator bypasses the semantic layer. Note that when using `LIKE` or `NOT LIKE` directly, wildcard characters (`%`) must be included manually in the value.

List of possible semantic match modes :  

| Name        | alias | types                   | Description |
| :---------- | :---- | :---------------------- | :-------------------------------------------------------- |
| startsWith  |       | string                  | Whether the value starts with the filter value |
| contains	  |       | string                  | Whether the value contains the filter value |
| endsWith    |       | string                  | Whether the value ends with the filter value |
| notContains |       | string                  | Whether the value does not contain filter value |
| equals	  |       | string \| number        | Whether the value equals the filter value |
| notEquals	  |       | string \| number        | Whether the value does not equal the filter value |
| in	      |       | string[] \| number[]    | Whether the value is included in the list |
| notIn	      |       | string[] \| number[]    | Whether the value is not included in the list |
| lt	      |       | string \| number        | Whether the value is less than the filter value |
| lte	      |       | string \| number        | Whether the value is less than or equals to the filter value |
| gt	      |       | string \| number        | Whether the value is greater than the filter value |
| gte	      |       | string \| number        | Whether the value is greater than or equals to the filter value |
| is	      |       | date \| boolean \| null | Whether the value equals the filter value, alias to equals |
| isNot	      |       | date \| boolean \| null | Whether the value does not equal the filter value, alias to notEquals |
| before      |       | date                    | Whether the date value is before the filter date |
| after	      |       | date                    | Whether the date value is after the filter date |
| between     |       | date[2] \| number[2]    | Whether the value is between the filter values | 
| st_contains |       | geometry                | Whether the geometry completely contains other geometries |
| st_dwithin  |       | geometry                | Whether geometries are within a specified distance from another geometry |

## Types

List of compatible match modes for each property types

| Name        | Match modes             |
| :---------- | :---------------------- | 
| string      | startsWith,<br>contains,<br>endsWith,<br>notContains,<br>equals,<br>notEquals,<br>in,<br>notIn,<br>lt,<br>lte,<br>gt,<br>gte |
| number      | equals,<br>notEquals,<br>in,<br>notIn,<br>lt,<br>lte,<br>gt,<br>gte |
| date        | is,<br>isNot,<br>before,<br>after |
| boolean     | is,<br>isNot            |
| string[]    | in                      |
| number[]    | in,<br>between          |
| date[]      | between                 |
| geometry    | st_contains,<br>st_dwithin |

List of secondary types : 

| Name               | equivalent |
| :----------------- | :--------- | 
| integer            | number     |
| float              | number     |
| even               | number     |
| odd                | number     |
| positive           | number     |
| negative           | number     |
| powerOfTwo         | number     |
| ascii              | number     |
| array              | any[]      |
| jwt                | string     |
| symbol             | string     |
| email              | string     |
| password           | string     |
| regex              | string     |
| ipAddress          | string     |
| slug               | string     |
| hexadecimal        | string     |
| date               | date       |
| timestamp          | date       |
| function           | string     |
| htmlElement        | string     |
| htmlEventAttribute | string     |
| node               | string     |
| json               | object     |
| object             | object     |


## Available options for a property

Any of these can be passed into the options object for each function.

| Name            | Type                      |               Description                         |  Default value  |  
| :-------------- | :------------------------ | :------------------------------------------------ | :-------------- |
| key             |  string                   | Name of the property                              |
| type            |  Type                     | Type of the property                              |
| min             |  number \| Date           | Minimum value                                     | 0 \| 1900-01-01
| max             |  number \| Date           | Maximum value                                     | 999999999 \| 2200-12-31
| requiredFor     |  Method[]                 | property is required for the listed methods only  | ["PATCH", "PUT", "POST"]
| isPrivate       |  boolean                  | Property is unsafe to send in the response        | true
| isTypeChecked   |  boolean                  | Type is checked during validation                 | false
| isFilterable    |  boolean                  | property is filterable in a SELECT operation      | true
| operations      |  Operation[]              | Property is used for the DML operations only      | ["SELECT", "INSERT", "UPDATE"]
| sanitizer       |  ((v: unknown) => unknown) \| null | Custom sanitizer function if sanitize is true     | null
| normalizer      |  ((v: unknown) => unknown) \| null | Custom Normalizer function if normalize is true   | null
| validator       |  ((v: unknown) => unknown) \| null | validator function if validate is true | null


* *Min and max parameters are not used for boolean type*
* *TypeCheck Parameter is not used for boolean, string and array types*

## Support

| Environment | Version |
| :---------- | :-----: |
| Node.js     |  >= 22  |

## Contributors

Antity.js is still in development and we would be glad to get all the help you can provide.
To contribute please read **[contributor.md](https://github.com/DWTechs/Antity.js/blob/main/contributor.md)** for detailed installation guide.

## Stack

| Purpose         |                    Choice                    |                                                     Motivation |
| :-------------- | :------------------------------------------: | -------------------------------------------------------------: |
| repository      |        [Github](https://github.com/)         |     hosting for software development version control using Git |
| package manager |     [npm](https://www.npmjs.com/get-npm)     |                                default node.js package manager |
| language        | [TypeScript](https://www.typescriptlang.org) | static type checking along with the latest ECMAScript features |
| module bundler  |      [Rollup](https://rollupjs.org)          |                        advanced module bundler for ES6 modules |
| unit testing    |          [Jest](https://jestjs.io/)          |                  delightful testing with a focus on simplicity |
