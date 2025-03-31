import type { Operations } from "./operations";

export type Operation = typeof Operations[number];

export type Filters = {
  [key: string]: Filter;
}

export type Filter = {
  value: string | number | boolean | Date | number[];
  subProps?: string[];
  matchMode?: MatchMode;
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
  "LIKE" |
  "NOT LIKE";

export type MatchMode =  
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


export type MappedType = "string" | "number" | "date";

export type Type =  
  "boolean" | 
  "string" | 
  "number" | 
  "integer" | 
  "float" |
  "even" |
  "odd" |
  "positive" |
  "negative" |
  "powerOfTwo" |
  "ascii" |
  "array" |
  "jwt" |
  "symbol" |
  "email" |
  "regex" |
  "json" |
  "ipAddress" |
  "slug" |
  "hexadecimal" |
  "date" |
  "timestamp" |
  "function" |
  "htmlElement" |
  "htmlEventAttribute" |
  "node" |
  "object" |
  "geometry";

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

export type Response = {
  rows: Record<string, unknown>[];
  total?: number;
};
