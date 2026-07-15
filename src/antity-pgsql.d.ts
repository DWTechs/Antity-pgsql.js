import { Entity, Property as BaseProperty } from "@dwtechs/antity";
import type { Type, Method } from "@dwtechs/antity";
import type { Request, Response, NextFunction } from 'express';

export type Operation = "SELECT" | "INSERT" | "UPDATE";
export type Sort = "ASC" | "DESC";
export type Filters = {
  [key: string]: Filter | Filter[];
};
export type Filter = {
  value: string | number | boolean | Date | number[];
  matchMode?: MatchMode;
  operator?: string;
};
export type { Type };

export declare class Property extends BaseProperty {
  isFilterable: boolean;
  operations: Operation[];
  constructor(
    key: string,
    type: Type,
    min: number | Date | null,
    max: number | Date | null,
    requiredFor: Method[],
    isPrivate: boolean,
    isTypeChecked: boolean,
    isFilterable: boolean,
    operations: Operation[] | undefined,
    sanitizer: ((v: unknown) => unknown) | null,
    normalizer: ((v: unknown) => unknown) | null,
    validator: ((v: unknown) => unknown) | null
  );
}

export type LogicalOperator = "AND" | "OR";
export type Comparator = "=" | "<" | ">" | "<=" | ">=" | "<>" | "IS" | "IS NOT" | "IN" | "NOT IN" | "LIKE" | "NOT LIKE" | "&&";
export type MatchMode = "startsWith" | "endsWith" | "contains" | "notContains" | "equals" | "notEquals" | "between" | "in" | "notIn" | "&&" | "lt" | "lte" | "gt" | "gte" | "is" | "isNot" | "before" | "after" | "st_contains" | "st_dwithin" | Comparator;
export type MappedType = "string" | "number" | "date" | "array";
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
export type Row = Record<string, Filter["value"]>;

export type PGClient = {
  query(text: string, values?: unknown[]): Promise<PGResponse>;
};

export type SelectResponse = {
  rows: Record<string, unknown>[];
  total?: number;
};

export type PGResponse = {
  rows: Record<string, unknown>[];
  rowCount: number | null;
  total?: number;
  command?: string;
  oid?: number;
  fields?: unknown[];
  _parsers?: unknown[];
  _types?: unknown;
  RowCtor?: unknown;
  rowAsArray?: boolean;
  _prebuiltEmptyResultObject?: Record<string, unknown>;
};

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;
type ExpressMiddlewareAsync = (req: Request, res: Response, next: NextFunction) => Promise<void>;
type SubstackTuple = [ExpressMiddleware, ExpressMiddleware, ExpressMiddlewareAsync];

export declare class SQLEntity extends Entity {
  private _table: string;
  private _schema: string;
  private sel: unknown;
  private ins: unknown;
  private upd: unknown;
  private ups: unknown;
  private arc: unknown;
  
  constructor(name: string, properties: Property[], schema?: string);
  
  get table(): string;
  set table(table: string);
  
  get schema(): string;
  set schema(schema: string);

  get properties(): Property[];

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
      filters?: Filters | null,
      operator?: LogicalOperator,
    ) => {
      query: string;
      args: (Filter["value"])[];
    };
    
    update: (
      rows: Row[],
      consumer?: { id?: number | string, nickname?: string }
    ) => {
      query: string;
      args: unknown[];
    };
    
    archive: (
      rows: Row[],
      consumer?: { id?: number | string, nickname?: string }
    ) => {
      query: string;
      args: unknown[];
    };
    
    insert: (
      rows: Row[],
      consumer?: { id?: number | string, nickname?: string },
      rtn?: string
    ) => {
      query: string;
      args: unknown[];
    };
    
    upsert: (
      rows: Row[],
      conflictTarget: string | string[],
      consumer?: { id?: number | string, nickname?: string },
      rtn?: string
    ) => {
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
  
  get(req: Request, res: Response, next: NextFunction): void;
  add(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  upsert(req: Request, res: Response, next: NextFunction): Promise<void>;
  sync(req: Request, res: Response, next: NextFunction): Promise<void>;
  archive(req: Request, res: Response, next: NextFunction): Promise<void>;
  delete(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteArchive(req: Request, res: Response, next: NextFunction): void;
  getHistory(req: Request, res: Response, next: NextFunction): void;
}

export declare function filter(
  first: number,
  rows: number | null,
  sortField: string | null,
  sortOrder: Sort | null,
  filters: Filters | null,
  operator?: LogicalOperator,
): { filterClause: string, args: (Filter["value"])[] };
  
export declare function execute(
  query: string, 
  args: (string | number | boolean | Date | number[])[], 
  client: PGClient | null
): Promise<PGResponse>;

