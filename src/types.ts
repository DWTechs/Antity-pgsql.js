import type { OPERATIONS } from "./constants";

export type Operation = typeof OPERATIONS[number];
export type Sort = "ASC" | "DESC";

export type Filters = {
  [key: string]: Filter | Filter[];
}

export type Filter = {
  value: string | number | boolean | Date | number[] | null;
  matchMode?: MatchMode;
  operator?: string;
}

export type LogicalOperator = "AND" | "OR";

export type Comparator = 
  "=" |
  "<" |
  ">" |
  "<=" |
  ">=" |
  "<>" |
  "IS" |
  "IS NOT" |
  "IN" |
  "NOT IN" |
  "LIKE" |
  "NOT LIKE" |
  "&&";

export type MatchMode =  
  "startsWith" | 
  "endsWith" |
  "contains" |
  "notContains" |
  "equals" |
  "notEquals" |
  "between" |
  "in" |
  "notIn" |
  "&&" |
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
  Comparator;


export type MappedType = "string" | "number" | "date" | "array";

export type Geometry = { 
  lng: number,
  lat: number,
  radius: number,
  bounds: {
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number
  } 
};

export type Row = Record<string, Filter["value"]>;

export type PGClient = {
  query(text: string, values?: unknown[]): Promise<PGResponse>;
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

export type SelectResponse = {
  rows: Record<string, unknown>[];
  total?: number;
};
