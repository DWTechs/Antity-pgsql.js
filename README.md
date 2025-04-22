
[![License: MIT](https://img.shields.io/npm/l/@dwtechs/antity-pgsql.svg?color=brightgreen)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40dwtechs%2Fantity.svg)](https://www.npmjs.com/package/@dwtechs/antity-pgsql)
[![last version release date](https://img.shields.io/github/release-date/DWTechs/Antity-pgsql.js)](https://www.npmjs.com/package/@dwtechs/antity-pgsql)
![Jest:coverage](https://img.shields.io/badge/Jest:coverage-100%25-brightgreen.svg)
[![minified size](https://img.shields.io/bundlephobia/min/@dwtechs/antity-pgsql?color=brightgreen)](https://www.npmjs.com/package/@dwtechs/antity-pgsql)

- [Synopsis](#synopsis)
- [Support](#support)
- [Installation](#installation)
- [Usage](#usage)
  - [ES6](#es6)
- [API Reference](#api-reference)
- [Contributors](#contributors)
- [Stack](#stack)


## Synopsis

**[Antity-pgsql.js](https://github.com/DWTechs/Antity-pgsql.js)** adds PostgreSQL features to **Antity.js** library.

- Very lightweight
- Thoroughly tested
- Works in Javascript, Typescript
- Can be used as EcmaScrypt module
- Written in Typescript


## Support

- node: 22

This is the oldest targeted versions. The library should work properly on older versions of Node.js but we do not support it officially.  


## Installation

```bash
$ npm i @dwtechs/antity-pgsql
```


## Usage


### ES6 / TypeScript

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
    methods: ["GET", "PUT", "DELETE"],
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
    methods: ["GET", "POST", "PUT", "DELETE"],
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
    methods: ["GET", "POST", "PUT", "DELETE"],
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
    methods: ["GET", "POST", "PUT", "DELETE"],
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

// add a consumer. Used when loggin in from user service
router.gett("/", ..., entity.get);
router.post("/", entity.normalize, entity.validate, ..., entity.add);
router.put("/", entity.normalize, entity.validate, ..., entity.update);
router.put("/", ..., entity.archive);

```

## API Reference


```javascript

type Operation = "select" | "insert" | "update" | "merge" | "delete";

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

class SQLEntity {
  constructor(name: string, properties: Property[]);
  get name(): string;
  get table(): string;
  get unsafeProps(): string[];
  get properties(): Property[];
  set name(name: string);
  set table(table: string);

  query: {
    select: (paginate: boolean) => string;
    update: (chunk: Record<string, unknown>[], consumerId: number | string, consumerName: string) => {
        query: string;
        args: unknown[];
    };
    insert: (chunk: Record<string, unknown>[], consumerId: number | string, consumerName: string, rtn?: string) => {
        query: string;
        args: unknown[];
    };
    delete: () => string;
    return: (prop: string) => string;
  };
  get(req: Request, res: Response, next: NextFunction): void;
  add(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  archive(req: Request, res: Response, next: NextFunction): Promise<void>;
  delete(req: Request, res: Response, next: NextFunction): void;

}

filter(
  first: number,
  rows: number | null,
  sortField: string | null,
  sortOrder: Sort,
  filters: Filters | null,
): { filterClause: string, args: (Filter["value"])[] } {


```
get(), add(), update(), archive() and delete() methods are made to be used as Express.js middlewares.
Each method will look for data to work on in the **req.body.rows** parameter.


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
