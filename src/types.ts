import type { PropertyInit as BasePropertyInit } from "@dwtechs/antity";
import type { OPERATIONS } from "./constants";

export type Operation = typeof OPERATIONS[number];
export type Sort = "ASC" | "DESC";

/**
 * Plain field definition accepted by `SQLEntity`'s constructor (one per property).
 * Extends antity's `PropertyInit` with the SQL-specific fields; omitted
 * `isFilterable`/`operations` get their defaults from `Property`.
 */
export interface PropertyInit extends BasePropertyInit {
  isFilterable?: boolean;
  operations?: Operation[];
}

export type Filters = {
  [key: string]: Filter | Filter[];
}

// Any scalar value that can be bound as a query parameter or stored in a row/column.
export type SqlValue = string | number | boolean | Date | number[] | null;

export type Filter = {
  value: SqlValue;
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
  "!=" |
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
  "dateIs" |
  "dateIsNot" |
  "dateBefore" |
  "dateAfter" |
  "st_contains" |
  "st_dwithin" |
  Comparator;

export type MappedType = "string" | "number" | "date" | "array" | "boolean";

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

export type Row = Record<string, SqlValue>;

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

/** One audited write read back from `log.history` (merged per action by `getHistory`). */
export type HistoryEntry = {
  id: number;
  tstamp: Date | string;
  operation: string;
  userId: number | null;
  userName: string | null;
  /** Row snapshot (`row_to_json(NEW)`) taken by the history trigger. */
  record: Record<string, unknown>;
};

export type HistoryOptions = {
  /** Audited table(s) to read; defaults to the entity's own table. Add junction tables to merge them into the same entries. */
  tables?: string[];
  /** Key of `record` to match, also the `req.params` name carrying the value. Defaults to `"id"`. */
  field?: string;
  /** Columns to ignore when deciding whether an entry changed anything meaningful. `updatedAt`/`updaterId`/`updaterName` are always ignored. */
  ignoreCols?: string[];
};
