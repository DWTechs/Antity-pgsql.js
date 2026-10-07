
[![License: MIT](https://img.shields.io/npm/l/@dwtechs/antity-pgsql.svg?color=brightgreen)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40dwtechs%2Fantity-pgsql.svg)](https://www.npmjs.com/package/@dwtechs/antity-pgsql)
[![last version release date](https://img.shields.io/github/release-date/DWTechs/Antity-pgsql.js)](https://www.npmjs.com/package/@dwtechs/antity-pgsql)
![Jest:coverage](https://img.shields.io/badge/Jest:coverage-99%25-brightgreen.svg)

- [Synopsis](#synopsis)
- [Support](#support)
- [Installation](#installation)
- [Configuration](#configuration)
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



## Configuration

Antity-pgsql reads its PostgreSQL connection details from the process environment.
Set these variables in your service's environment before opening any connection:

| Variable  | Required | Default | Description                 |
| --------- | -------- | ------- | --------------------------- |
| `DB_HOST` | yes      | —       | PostgreSQL server hostname  |
| `DB_USER` | yes      | —       | PostgreSQL user             |
| `DB_PWD`  | yes      | —       | PostgreSQL user password    |
| `DB_NAME` | yes      | —       | PostgreSQL database name    |
| `DB_PORT` | no       | `5432`  | PostgreSQL server port      |
| `DB_MAX`  | no       | `10`    | Maximum pool connections    |

### Connection Pool

Since 0.22.0, the underlying [pg-pool](https://www.npmjs.com/package/pg-pool)
client is initialized **lazily** — it is opened on the first call to `execute()`
or `SQLEntity.query.sync()`, not at module import.

- Consumers that only use the query-builder surface (`SQLEntity.query.select`,
  `filter`) without ever executing a query never open a socket.
- Combined with `"sideEffects": false`, the library is fully tree-shakable and
  safe to import at boot without side effects.
- Boot sequences that call `execute()` inside `Promise.all([...init()])` will
  surface connection failures through that promise. Pair it with
  [`@dwtechs/servpico-express`](https://www.npmjs.com/package/@dwtechs/servpico-express)'s
  `failFast` helper for a clean exit.



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

// Example. Optional fields can be omitted to get their default:
// min/max (default range), sanitizer, normalizer, validator (none),
// requiredFor ([]), isPrivate / isTypeChecked / readOnly (false),
// operations ([] = the property takes part in no query) and isFilterable (not filterable).
const consumers = new SQLEntity("consumers", [
  {
    key: "id",
    type: "integer",
    min: 0,
    max: 120,
    isTypeChecked: true,
    isFilterable: true,
    requiredFor: ["PUT"],
    operations: ["SELECT", "UPDATE"],
  },
  {
    key: "firstName",
    type: "string",
    min: 0,
    max: 255,
    isTypeChecked: true,
    requiredFor: ["POST", "PUT"],
    operations: ["SELECT", "UPDATE"],
    normalizer: normalizeName,
  },
  {
    key: "lastName",
    type: "string",
    min: 0,
    max: 255,
    isTypeChecked: true,
    requiredFor: ["POST", "PUT"],
    operations: ["SELECT", "UPDATE"],
    normalizer: normalizeName,
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
    normalizer: normalizeNickname,
  },
]);

router.get("/", ..., consumers.get);

// Using substacks (recommended) - combines normalize, validate, and database operation
router.post("/", ...consumers.addArraySubstack);
router.put("/", ...consumers.updateArraySubstack);
router.put("/preferences", ...consumers.syncArraySubstack);

// Or manually chain middlewares
router.post("/manual", consumers.normalizeArray, consumers.validateArray, ..., consumers.add);
router.put("/manual", consumers.normalizeArray, consumers.validateArray, ..., consumers.update);

router.patch("/archive", ..., consumers.archive);
router.delete("/", ..., consumers.delete);
router.delete("/archived", ..., consumers.deleteArchive);
router.get("/:id/history", ..., consumers.getHistory);

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
  "IS" | "IS NOT" | "IN" | "NOT IN" | "LIKE" | "NOT LIKE" | "&&";

type MatchMode =  
  "startsWith" | 
  "endsWith" |
  "contains" |
  "notContains" |
  "equals" |
  "notEquals" |
  "!=" |
  "between" | // reserved for future use — not yet enforced by check.matchMode()
  "in" |
  "notIn" |
  "&&" | // array overlap — use with array-typed columns; generates: column && ARRAY[$1,$2]
  "lt" |
  "lte" |
  "gt" |
  "gte" |
  "is" |
  "isNot" |
  "before" |
  "after" |
  "st_contains" | // reserved for future use — not yet enforced by check.matchMode()
  "st_dwithin" |  // reserved for future use — not yet enforced by check.matchMode()
  Comparator; // direct SQL comparators are also accepted


type Filters = {
  [key: string]: Filter | Filter[]; // Supports both simple (object) and complex (array) formats
}

// Any scalar value that can be bound as a query parameter or stored in a row/column.
type SqlValue = string | number | boolean | Date | number[] | null;

type Filter = {
  value: SqlValue;
  matchMode?: MatchMode; // semantic mode or direct SQL comparator
  operator?: string; // 'and' | 'or' - Used when multiple filters apply to the same property
}

type HistoryEntry = {
  id: number;
  tstamp: Date | string;
  operation: string;
  userId: number | null;
  userName: string | null;
  record: Record<string, unknown>; // row snapshot taken by the history trigger
};

type HistoryOptions = {
  tables?: string[];     // audited table(s) to read, defaults to the entity's own table
  field?: string;        // record key to match and req.params name, defaults to "id"
  ignoreCols?: string[]; // columns that do not count as a change (updatedAt/updaterId/updaterName always ignored)
};

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

// SQLEntity extends Entity from @dwtechs/antity: normalizeArray(), normalizeOne(),
// validateArray(), validateOne(), getProp() and getPropsByMethod() are inherited.
class SQLEntity {
  constructor(name: string, properties: PropertyInit[], schema?: string);
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
      limit?: number | null,
      sortField?: string | null,
      sortOrder?: "ASC" | "DESC" | null,
      filters?: Filters | null,
      operator?: LogicalOperator) => {
        query: string;
        args: SqlValue[];
      };
    update: (
      rows: Row[],
      consumer?: { userId?: number | string, nickname?: string }) => {
        query: string;
        args: unknown[];
    };
    archive: (
      rows: (Row | SqlValue)[],
      consumer?: { userId?: number | string, nickname?: string }) => {
        query: string;
        args: unknown[];
    };
    insert: (
      rows: Row[],
      consumer?: { userId?: number | string, nickname?: string },
      rtn?: string) => {
        query: string;
          args: unknown[];
      };
    upsert: (
      rows: Row[],
      conflictTarget: string | string[],
      consumer?: { userId?: number | string, nickname?: string },
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
  getCache: (filters?: Filters | null, client?: PGClient | null) => Promise<Record<string, unknown>[]>;
  add: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  upsert: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  sync: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  archive: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteArchive: (req: Request, res: Response, next: NextFunction) => void;
  getHistory: (req: Request, res: Response, next: NextFunction) => void;
  history: (options?: HistoryOptions) => (req: Request, res: Response, next: NextFunction) => void;

}

function filter(
  first: number,
  rows: number | null,
  sortField: string | null,
  sortOrder: Sort | null,
  filters: Filters | null,
  operator?: LogicalOperator,
): { filterClause: string, args: SqlValue[] };

function execute(
  query: string, 
  args: SqlValue[], 
  client: PGClient | null,
): Promise<PGResponse>;

// The pure helpers behind getHistory()/history(), for custom history endpoints
function groupHistoryByAction(rows: HistoryEntry[]): HistoryEntry[];
function filterMeaningfulHistory(rows: HistoryEntry[], ignoreCols?: string[]): HistoryEntry[];


```



### Middleware Methods for Express.js

- get(), add(), update(), upsert(), sync(), archive(), delete(), deleteArchive() and getHistory() methods are made to be used as Express.js middlewares.
- add(), update() and upsert() accept either **req.body.rows** (as an array of entities for bulk operations) or **req.body** itself (as a single entity).
- archive() and sync() look for data to work on exclusively in the **req.body.rows** parameter (as an array).
- get() reads req.body.first, req.body.limit, req.body.sortField, req.body.sortOrder, req.body.filters and req.body.operator instead. Page size is exclusively **req.body.limit** (a number); req.body.rows is intentionally ignored by get(), since that same key means "array of entities" for every other method above and reusing it for pagination was error-prone.
- delete() reads req.body.rows ([{id: 1}, {id: 2}]) if present, otherwise falls back to a single req.params.id.
- The upsert() method additionally requires **req.body.conflictTarget** to specify which column(s) define uniqueness.
- The sync() method accepts an optional **req.body.idField** (defaults to `'id'`) and optional **req.body.filters** to scope which existing rows are considered part of the managed set.



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

- **query.select()**: Generates a SELECT query. When the `limit` parameter is provided (not null), pagination is automatically enabled and the query includes `COUNT(*) OVER () AS total` to return the total number of rows. The total count is extracted from results and returned separately from the row data. The `sortField` parameter is validated against the entity's known properties; an unrecognised value is silently dropped.
- **getCache()**: Loads active rows for an in-memory cache warm-up. Always ANDs `archived IS FALSE` (a caller-supplied `archived` filter is overwritten). Takes optional extra `filters` and a `client`. Returns a `Promise` of rows with **no `LIMIT`**, ordered by `id ASC`. An empty result resolves to `[]` — unlike `get()`, which forwards a 404 through `next`. Requires a filterable `archived` property on the entity.
- **query.insert()**: Generates an INSERT query. Accepts an array of `Row` objects with properties matching the entity definition. Consumer fields are appended directly to the query arguments — row objects are **not mutated**. Optionally appends `consumer.userId` as `creatorId` and `consumer.nickname` as `creatorName` for audit tracking. Supports `RETURNING` clause via the `rtn` parameter.
- **query.update()**: Generates an UPDATE query using CASE statements. Accepts an array of `Row` objects with `id` property. Optionally appends `consumer.userId` as `updaterId` and `consumer.nickname` as `updaterName` for audit tracking.
- **query.upsert()**: Generates an INSERT ... ON CONFLICT ... DO UPDATE query. (See [Upsert](#upsert-insert-or-update) section below.) Accepts an array of `Row` objects and a `conflictTarget` (single column name or array of column names) that defines uniqueness. If a conflict occurs on the specified column(s), the row is updated; otherwise, it is inserted. Properties are automatically included if they have both INSERT and UPDATE operations. Consumer fields are appended directly to the query arguments — row objects are **not mutated**. Optionally appends `consumer.userId` as `creatorId` and `consumer.nickname` as `creatorName` on INSERT, and as `updaterId`/`updaterName` on CONFLICT UPDATE, for audit tracking. Supports `RETURNING` clause via the `rtn` parameter.
- **query.archive()**: Generates a `UPDATE ... SET archived = true WHERE id IN (...)` query. Accepts an array of ids, or of `Row` objects with an `id` property. Optionally appends `consumer.userId` as `updaterId` and `consumer.nickname` as `updaterName` for audit tracking. Does not require an `archived` field in the rows — it is set directly in the SQL.
- **sync()**: Atomically synchronises the table with the provided rows inside a single PostgreSQL transaction. Missing rows are inserted, existing rows are updated, and rows absent from the list are deleted. Accepts optional `idField` (default `'id'`) and `filters` to restrict the scope of managed rows. Stores the result in `res.locals.rows` and a summary `{ inserted, updated, deleted }` in `res.locals.sync`.
- **delete()**: Deletes rows by their IDs. Reads ids from `req.body.rows` (array of objects with `id` property: `[{id: 1}, {id: 2}]`) if present, otherwise falls back to a single `req.params.id` (e.g. a `DELETE /resource/:id` route). Calls `next({ statusCode: 400, message: "Missing rows in req.body or id in req.params for delete operation" })` if neither is provided.
- **deleteArchive()**: Deletes archived rows that were archived before a specific date using a PostgreSQL SECURITY DEFINER function. Expects `req.body.date` to be a Date object.
- **getHistory()**: Returns the modification history of one record, read from the `log.history` table for this entity's table and schema. Reads the record id from `req.params.id` (e.g. `GET /resource/:id/history`) and calls `next({ statusCode: 400, message: "Missing id" })` without it. Stores the entries, oldest first, in `res.locals.rows` and their count in `res.locals.total`. See [History](#history).



### History

`getHistory` and `history(options)` turn the raw `log.history` rows written by the audit trigger into entries a revision view can show. Every entry is `{ id, tstamp, operation, userId, userName, record }`, where `record` is the row snapshot and `userId`/`userName` are the author of the write, as stored in `log.history`.

- **Grouping**: rows written by the same transaction (same `tstamp`, `userId` and `record.id`) are merged into one entry, so a record and the junction-table rows rewritten with it read as a single action. Rows of different records stay apart, even when several are updated in one bulk transaction.
- **No-op filtering**: an entry that changed nothing but ignored columns is dropped. `updatedAt`, `updaterId` and `updaterName` are always ignored; add your own with `ignoreCols`. The first entry (the `INSERT`) is always kept.
- **404**: `next({ statusCode: 404, message: "history not found" })` when there is no history, or only the initial `INSERT`.
- **400**: `next({ statusCode: 400, message: "Missing id" })` when the param is absent, `"Invalid id"` when it is not a non-negative integer that fits a PostgreSQL `INT` (the query casts the stored value to `INT`). The database is not queried in either case.

```javascript
// History of this entity's own table
router.get("/:id/history", routeEntity.getHistory);

// Merge junction tables into the same entries
router.get("/:id/history", routeEntity.history({
  tables: ["route", "route_operation", "route_method"],
}));

// History of the rows linked to a parent id: matches record.routeId against req.params.routeId
router.get("/:routeId/history", permissionEntity.history({
  tables: ["permission", "permission_condition"],
  field: "routeId",
}));

// Do not count system-managed columns as a change
router.get("/:id/history", pwdEntity.history({ ignoreCols: ["lastLoginAt", "failedAttempts"] }));

// res.locals.rows  -> entries, oldest first
// res.locals.total -> number of entries
```

**Entities backed by a view.** `log.history` records the table the audit trigger sits on. If your entity reads a view (with `INSTEAD OF` triggers writing to base tables), its own table name never appears there, so `getHistory` finds nothing and always answers 404. Pass the base table(s) instead: `history({ tables: ["role"] })`.

`field` must be a valid SQL identifier (otherwise `history()` throws when the route is defined). The field name and the tables are passed to PostgreSQL as parameters, never concatenated into the query. The database client is read from `res.locals.dbClient`, falling back to the shared pool.



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
- **Consumer tracking**: `consumer.userId` and `consumer.nickname` from `res.locals.consumer` are forwarded to inserts as `creatorId`/`creatorName` and to updates as `updaterId`/`updaterName` for audit tracking.



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
  { userId: 1, nickname: 'admin' }, // consumer (optional)
  'RETURNING id' // return clause (optional)
);
// Generates:
// INSERT INTO public.users (name, email, "creatorId", "creatorName")
// VALUES ($1, $2, $3, $4)
// ON CONFLICT (id) DO UPDATE SET 
//   name = EXCLUDED.name,
//   email = EXCLUDED.email,
//   "updaterId" = EXCLUDED."creatorId",
//   "updaterName" = EXCLUDED."creatorName"
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



#### Top-level Logical Operator

By default, top-level filter properties are combined with `AND`. You can pass an optional `operator` argument to `filter()` or `query.select()` (or read from `req.body.operator` when using the `get()` middleware) to combine them with `OR` instead:

```javascript
import { filter } from "@dwtechs/antity-pgsql";

const filters = {
  name: [{ value: 'John', matchMode: 'contains' }],
  age: [{ value: 30, matchMode: 'equals' }]
};

const result = filter(
  0,
  null,
  null,
  null,
  filters,
  "OR" // top-level logical operator
);
```

This generates SQL like:

```sql
WHERE name LIKE '%John%' OR age = 30
```



#### Mixing Property-Level & Top-Level Logical Operators

You can specify logical operators between conditions on the same property to build compound rules, and combine these top-level property filters with a different top-level logical operator (such as `OR`):

```javascript
import { filter } from "@dwtechs/antity-pgsql";

const filters = {
  name: [{ value: 'John', matchMode: 'equals' }],
  nickname: [
    { value: null, matchMode: 'is', operator: 'or' },
    { value: 'John', matchMode: 'equals', operator: 'or' }
  ]
};

const result = filter(
  0,
  null,
  null,
  null,
  filters,
  "OR" // top-level logical operator combining 'name' and 'nickname' conditions
);
```

This generates SQL like:

```sql
WHERE name = $1 OR (nickname IS NULL OR nickname = $2)
```

**Notes:**
`is` **/** `isNot` **with** `null`**,** `true` **or** `false`**:** these are rendered as a SQL literal (`col IS NULL`, `col IS NOT NULL`, `col IS TRUE`, `col IS NOT FALSE`, etc.) rather than a bound parameter, since PostgreSQL's `IS` operator only accepts the `NULL`/`TRUE`/`FALSE`/`UNKNOWN` keywords. These filters don't consume a placeholder index or push a value into the returned `args`. Using `is`/`isNot` with any other value type (e.g. a string or number) still generates a bound parameter, unchanged.

## Match modes

`matchMode` accepts either a **semantic match mode** (listed below) or a **direct SQL comparator** (`=`, `<`, `>`, `<=`, `>=`, `<>`, `IS`, `IS NOT`, `IN`, `NOT IN`, `LIKE`, `NOT LIKE`).

Using a direct comparator bypasses the semantic layer. Note that when using `LIKE` or `NOT LIKE` directly, wildcard characters (`%`) must be included manually in the value.

List of possible semantic match modes :  


| Name        | alias     | types                 | Description                                                                                                                                                                                    |
| ----------- | --------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| startsWith  |           | string                | Whether the value starts with the filter value                                                                                                                                                 |
| contains    |           | string                | Whether the value contains the filter value                                                                                                                                                    |
| endsWith    |           | string                | Whether the value ends with the filter value                                                                                                                                                   |
| notContains |           | string                | Whether the value does not contain filter value                                                                                                                                                |
| equals      |           | string | number       | Whether the value equals the filter value                                                                                                                                                      |
| notEquals   |           | string | number       | Whether the value does not equal the filter value                                                                                                                                              |
| !=          | notEquals | string | number       | SQL-symbol alias of `notEquals`.                                                                                                                                                               |
| in          |           | string[] | number[]   | Whether the value is included in the list                                                                                                                                                      |
| notIn       |           | string[] | number[]   | Whether the value is not included in the list                                                                                                                                                  |
| lt          |           | string | number       | Whether the value is less than the filter value                                                                                                                                                |
| lte         |           | string | number       | Whether the value is less than or equals to the filter value                                                                                                                                   |
| gt          |           | string | number       | Whether the value is greater than the filter value                                                                                                                                             |
| gte         |           | string | number       | Whether the value is greater than or equals to the filter value                                                                                                                                |
| is          |           | string | number | date | boolean | null | Whether the value equals the filter value, alias to equals. Renders as an `IS` literal (`IS NULL` / `IS TRUE` / `IS FALSE`) when value is `null`, `true` or `false`                            |
| isNot       |           | string | number | date | boolean | null | Whether the value does not equal the filter value, alias to notEquals. Renders as an `IS NOT` literal (`IS NOT NULL` / `IS NOT TRUE` / `IS NOT FALSE`) when value is `null`, `true` or `false` |
| before      |           | date                  | Whether the date value is before the filter date                                                                                                                                               |
| after       |           | date                  | Whether the date value is after the filter date                                                                                                                                                |
| dateIs      | is        | date                  | Alias of `is` for date fields                                                                                                                                                                  |
| dateIsNot   | isNot     | date                  | Alias of `isNot` for date fields                                                                                                                                                               |
| dateBefore  | before    | date                  | Alias of `before` for date fields                                                                                                                                                              |
| dateAfter   | after     | date                  | Alias of `after` for date fields                                                                                                                                                               |




## Types

List of compatible match modes for each property types. 


| Name     | Match modes                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| string   | startsWith, contains, endsWith, notContains, equals, notEquals, !=, in, notIn, lt, lte, gt, gte, is, isNot |
| number   | equals, notEquals, !=, in, notIn, lt, lte, gt, gte, is, isNot                                              |
| date     | is, isNot, before, after, dateIs, dateIsNot, dateBefore, dateAfter                                         |
| boolean  | is, isNot                                                                                                  |
| array    | in (translated to the `&&` overlap operator)                                                              |


*Note: All types support the semantic match modes* `is`*/*`isNot` *or direct comparators* `IS`*/*`IS NOT` *when querying for* `null` *or* `not null` *values.*

List of secondary types : 


| Name               | equivalent |
| ------------------ | ---------- |
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


| Name          | Type                             | Description                                      | Default value                  |
| ------------- | -------------------------------- | ------------------------------------------------ | ------------------------------ |
| key           | string                           | Name of the property                             |                                |
| type          | Type                             | Type of the property                             |                                |
| min           | number \| Date                   | Minimum value (omit for the default)             | 0 \| 1900-01-01                |
| max           | number \| Date                   | Maximum value (omit for the default)             | 999999999 \| 2200-12-31        |
| requiredFor   | Method[]                         | Property is required for the listed methods only | []                             |
| isPrivate     | boolean                          | Property is unsafe to send in the response       | false                          |
| isTypeChecked | boolean                          | Type is checked during validation                | false                          |
| isFilterable  | boolean                          | Property is filterable in a SELECT operation     | not filterable (set `true`)    |
| operations    | Operation[]                      | DML operations the property takes part in        | [] (set the ones you need)     |
| sanitizer     | ((v: any) => any) \| null        | Custom sanitizer, replaces the default trim      | null (omit)                    |
| normalizer    | ((v: any) => any) \| null        | Custom normalizer, run right after sanitizing    | null (omit)                    |
| validator     | ((v: any) => boolean) \| null    | Custom validator, replaces the built-in type check | null (omit)                 |
| readOnly      | boolean                          | Property is system-managed, not directly editable | false                         |


- *Min and max parameters are not used for boolean type*
- *TypeCheck Parameter is not used for boolean, string and array types*
- *`sanitizer`, `normalizer` and `validator` must be a function, `null` or omitted: any other value throws when the entity is created.*
- *Fields not listed above are kept on the property as custom data, with a warning in the logs (a probable typo). `isFilterable` and `operations` are declared by `SQLEntity`, so they never warn.*



## Support


| Environment | Version |
| ----------- | ------- |
| Node.js     | >= 22   |




## Contributors

Antity-pgsql.js is still in development and we would be glad to get all the help you can provide.
To contribute please read **[contributor.md](https://github.com/DWTechs/Antity-pgsql.js/blob/main/contributor.md)** for detailed installation guide.

## Stack


| Purpose         | Choice                                       | Motivation                                                     |
| --------------- | -------------------------------------------- | -------------------------------------------------------------- |
| repository      | [Github](https://github.com/)                | hosting for software development version control using Git     |
| package manager | [npm](https://www.npmjs.com/get-npm)         | default node.js package manager                                |
| language        | [TypeScript](https://www.typescriptlang.org) | static type checking along with the latest ECMAScript features |
| module bundler  | [Rollup](https://rollupjs.org)               | advanced module bundler for ES6 modules                        |
| unit testing    | [Jest](https://jestjs.io/)                   | delightful testing with a focus on simplicity                  |


