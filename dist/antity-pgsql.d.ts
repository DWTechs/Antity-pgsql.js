/*
MIT License

Copyright (c) 2025 DWTechs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

https://github.com/DWTechs/Antity-pgsql.js
*/

import { Entity, Property } from "@dwtechs/antity";
import type { Request, Response, NextFunction } from 'express';

export type Operation = "SELECT" | "INSERT" | "UPDATE" | "DELETE";
export type Sort = "ASC" | "DESC";
export type Filters = {
  [key: string]: Filter;
};
export type Filter = {
  value: string | number | boolean | Date | number[];
  subProps?: string[];
  matchMode?: MatchMode;
};
export type LogicalOperator = "AND" | "OR";
export type Comparator = "=" | "<" | ">" | "<=" | ">=" | "<>" | "IS" | "IS NOT" | "IN" | "LIKE" | "NOT LIKE";
export type MatchMode = "startsWith" | "endsWith" | "contains" | "notContains" | "equals" | "notEquals" | "between" | "in" | "lt" | "lte" | "gt" | "gte" | "is" | "isNot" | "before" | "after" | "st_contains" | "st_dwithin";
export type MappedType = "string" | "number" | "date";
export type Type = "boolean" | "string" | "number" | "integer" | "float" | "even" | "odd" | "positive" | "negative" | "powerOfTwo" | "ascii" | "array" | "jwt" | "symbol" | "email" | "regex" | "json" | "ipAddress" | "slug" | "hexadecimal" | "date" | "timestamp" | "function" | "htmlElement" | "htmlEventAttribute" | "node" | "object" | "geometry";
export type Geometry = {
  lng: number;
  lat: number;
  radius: number;
  bounds: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  };
};
export type PGResponse = {
  rows: Record<string, unknown>[];
  rowCount: number;
  total?: number;
  command?: string;
  oid?: number;
  fields?: unknown[];
  _parsers?: unknown[];
  _types?: unknown;
  RowCtor?: unknown;
  rowAsArray?: boolean;
};

declare class SQLEntity extends Entity {
  private _table;
  private sel;
  private ins;
  private upd;
  constructor(name: string, properties: Property[]);
  get table(): string;
  set table(table: string);
  query: {
    select: (paginate: boolean) => string;
    update: (rows: Record<string, unknown>[], consumerId: number | string, consumerName: string) => {
      query: string;
      args: unknown[];
    };
    insert: (rows: Record<string, unknown>[], consumerId: number | string, consumerName: string, rtn?: string) => {
      query: string;
      args: unknown[];
    };
    delete: () => string;
    return: (prop: string) => string;
  };
  get: (req: Request, res: Response, next: NextFunction) => void;
  add: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  archive: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  delete: (req: Request, res: Response, next: NextFunction) => void;
}

declare function filter(
  first: number,
  rows: number | null,
  sortField: string | null,
  sortOrder: Sort | null,
  filters: Filters | null,
): { filterClause: string, args: (Filter["value"])[] };
  
declare function execute(
  query: string, 
  args: (string | number | boolean | Date | number[])[], 
  client: any
): Promise<PGResponse>;

export { 
  SQLEntity,
  Property,
  filter,
  execute,
};

