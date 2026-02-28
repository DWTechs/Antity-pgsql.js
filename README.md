
[![License: MIT](https://img.shields.io/npm/l/@dwtechs/antity-pgsql.svg?color=brightgreen)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40dwtechs%2Fantity-pgsql.svg)](https://www.npmjs.com/package/@dwtechs/antity-pgsql)
[![last version release date](https://img.shields.io/github/release-date/DWTechs/Antity-pgsql.js)](https://www.npmjs.com/package/@dwtechs/antity-pgsql)
![Jest:coverage](https://img.shields.io/badge/Jest:coverage-54%25-brightgreen.svg)

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


## Support

- node: 22

This is the oldest targeted versions. The library should work properly on older versions of Node.js but we do not support it officially.  


## Installation

```bash
$ npm i @dwtechs/antity-pgsql
```


## Usage


```javascript

import { SQLEntity } from "@dwtechs/antity-pgsql";
import { normalizeName, normalizeNickname } from "@dwtechs/checkard";

const entity = new Entity("consumers", [
  {
    key: "id",
    type: "integer",
    min: 0,
    max: 120,
    typeCheck: true,
    filter: true,
    methods: ["GET", "PUT", "DELETE"],
    operations: ["SELECT", "UPDATE", "DELETE"],
    required: true,
    safe: true,
    sanitize: true,
    normalize: true,
    validate: true,
    sanitizer: null,
    normalizer: null,
    validator: null,
  },
  {
    key: "firstName",
    type: "string",
    min: 0,
    max: 255,
    typeCheck: true,
    filter: false,
    methods: ["GET", "POST", "PUT", "DELETE"],
    operations: ["SELECT", "UPDATE", "DELETE"],
    required: true,
    safe: true,
    sanitize: true,
    normalize: true,
    validate: true,
    sanitizer: null,
    normalizer: normalizeName,
    validator: null,
  },
  {
    key: "lastName",
    type: "string",
    min: 0,
    max: 255,
    typeCheck: true,
    filter: false,
    methods: ["GET", "POST", "PUT", "DELETE"],
    operations: ["SELECT", "UPDATE", "DELETE"],
    required: true,
    safe: true,
    sanitize: true,
    normalize: true,
    validate: true,
    sanitizer: null,
    normalizer: normalizeName,
    validator: null,
  },
  {
    key: "nickname",
    type: "string",
    min: 0,
    max: 255,
    typeCheck: true,
    filter: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    operations: ["SELECT", "UPDATE", "DELETE"],
    required: true,
    safe: true,
    sanitize: true,
    normalize: true,
    validate: true,
    sanitizer: null,
    normalizer: normalizeNickname,
    validator: null,
  },
]);

router.get("/", ..., entity.get);

// Using substacks (recommended) - combines normalize, validate, and database operation
router.post("/", ...entity.addArraySubstack);
router.put("/", ...entity.updateArraySubstack);

// Or manually chain middlewares
router.post("/manual", entity.normalizeArray, entity.validateArray, ..., entity.add);
router.put("/manual", entity.normalizeArray, entity.validateArray, ..., entity.update);

router.put("/archive", ..., entity.archive);
router.delete("/", ..., entity.delete);
router.delete("/archived", ..., entity.deleteArchive);

```

## API Reference


```javascript

type Operation = "SELECT" | "INSERT" | "UPDATE" | "DELETE";

type MatchMode =  
  "startsWith" | 
  "endsWith" |
  "contains" |
  "notContains" |
  "equals" |
  "notEquals" |
  "between" |
  "in" |
  "lt" |
  "lte" |
  "gt" |
  "gte" |
  "is" |
  "isNot" |
  "before" |
  "after" |
  "st_contains" |
  "st_dwithin";


type Filter = {
  value: string | number | boolean | Date | number[];
  subProps?: string[];
  matchMode?: MatchMode;
}

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;
type ExpressMiddlewareAsync = (req: Request, res: Response, next: NextFunction) => Promise<void>;
type SubstackTuple = [ExpressMiddleware, ExpressMiddleware, ExpressMiddlewareAsync];

class SQLEntity {
  constructor(name: string, properties: Property[]);
  get name(): string;
  get table(): string;
  get unsafeProps(): string[];
  get properties(): Property[];
  set name(name: string);
  set table(table: string);

  // Middleware substacks (combine normalize, validate, and operation)
  get addArraySubstack(): SubstackTuple;
  get addOneSubstack(): SubstackTuple;
  get updateArraySubstack(): SubstackTuple;
  get updateOneSubstack(): SubstackTuple;

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
      rows: Record<string, unknown>[],
      consumerId?: number | string,
      consumerName?: string) => {
        query: string;
        args: unknown[];
    };
    insert: (
      rows: Record<string, unknown>[],
      consumerId?: number | string,
      consumerName?: string,
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
  archive: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteArchive: (req: Request, res: Response, next: NextFunction) => void;

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
  client: any,
): Promise<PGResponse>;


```

### Middleware Methods

get(), add(), update(), archive(), delete() and deleteArchive() methods are made to be used as Express.js middlewares.
Each method will look for data to work on in the **req.body.rows** parameter.

### Middleware Substacks

Substacks are pre-composed middleware chains that combine normalization, validation, and database operations:

- **addArraySubstack**: Combines `normalizeArray`, `validateArray`, and `add`. Use this for POST routes with `req.body.rows` containing multiple objects.
- **addOneSubstack**: Combines `normalizeOne`, `validateOne`, and `add`. Use this for POST routes with `req.body` containing a single object.
- **updateArraySubstack**: Combines `normalizeArray`, `validateArray`, and `update`. Use this for PUT routes with `req.body.rows` containing multiple objects.
- **updateOneSubstack**: Combines `normalizeOne`, `validateOne`, and `update`. Use this for PUT routes with `req.body` containing a single object.

Using substacks simplifies your route definitions and ensures consistent data processing.

### Query Methods

- **query.select()**: Generates a SELECT query. When the `rows` parameter is provided (not null), pagination is automatically enabled and the query includes `COUNT(*) OVER () AS total` to return the total number of rows. The total count is extracted from results and returned separately from the row data.
- **delete()**: Deletes rows by their IDs. Expects `req.body.rows` to be an array of objects with `id` property: `[{id: 1}, {id: 2}]`
- **deleteArchive()**: Deletes archived rows that were archived before a specific date. Expects `req.body.date` to be a Date object.


## Match modes

List of possible match modes :  

| Name        | alias | types                   | Description |
| :---------- | :---- | :---------------------- | :-------------------------------------------------------- |
| startsWith  |       | string                  | Whether the value starts with the filter value |
| contains	  |       | string                  | Whether the value contains the filter value |
| endsWith    |       | string                  | Whether the value ends with the filter value |
| notContains |       | string                  | Whether the value does not contain filter value |
| equals	  |       | string \| number        | Whether the value equals the filter value |
| notEquals	  |       | string \| number        | Whether the value does not equal the filter value |
| in	      |       | string[] \| number[]    | Whether the value contains the filter value |
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
| string      | startsWith,<br>contains,<br>endsWith,<br>notContains,<br>equals,<br>notEquals,<br>lt,<br>lte,<br>gt,<br>gte |
| number      | equals,<br>notEquals,<br>lt,<br>lte,<br>gt,<br>gte |
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
| required        |  boolean                  | Property is required during validation            | false
| safe            |  boolean                  | Property is sent in the response                  | true
| typeCheck       |  boolean                  | Type is checked during validation                 | false
| filter          |  boolean                  | property is filterable in a SELECT operation      | true
| methods         |  Method[]                 | property is validated for the listed methods only | [ "GET", "POST", "PUT", "DELETE" ]
| operations      |  Operation[]              | SQL DML operations for the property               | [ "SELECT", "INSERT", "UPDATE", "DELETE" ]
| sanitize        |  boolean                  | Sanitize the property if true                     | true
| normalize       |  boolean                  | Normalize the property if true                    | false
| validate        |  boolean                  | validate the property if true                     | true
| sanitizer       |  ((v:any) => any) \| null | Custom sanitizer function if sanitize is true     | null
| normalizer      |  ((v:any) => any) \| null | Custop Normalizer function if normalize is true   | null
| validator       |  ((v:any, min:number, max:number, typeCheck:boolean) => any) \| null  | validator function if validate is true            | null


* *Min and max parameters are not used for boolean type*
* *TypeCheck Parameter is not used for boolean, string and array types*


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
