import { Entity } from "@dwtechs/antity";
import { Type } from "@dwtechs/antity";
import { Property } from './property';
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
export { Type };
export type LogicalOperator = "AND" | "OR";
export type Comparator = "=" | "<" | ">" | "<=" | ">=" | "<>" | "IS" | "IS NOT" | "IN" | "LIKE" | "NOT LIKE";
export type MatchMode = "startsWith" | "endsWith" | "contains" | "notContains" | "equals" | "notEquals" | "between" | "in" | "lt" | "lte" | "gt" | "gte" | "is" | "isNot" | "before" | "after" | "st_contains" | "st_dwithin";
export type MappedType = "string" | "number" | "date";
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

