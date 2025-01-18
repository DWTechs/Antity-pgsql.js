import map from "./map";
import type { MatchMode, LogicalOperator } from "./types";

function addContition(key: string, index: number, matchMode: MatchMode | undefined ): string { 
  const sqlKey = `\"${key}\"`; // escaped property name for sql query
  const comparator = map.comparator(matchMode);
  const mappedIndex = map.index(index, matchMode);
  return `${sqlKey} ${comparator} ${mappedIndex}`;
}

// Builds where clause
function where(conditions: string[], operator: LogicalOperator): string {
  return conditions
    ? ` WHERE ${conditions.join(operator).trim()}`
    : "";
}

  // Adds order by clause
function orderBy(sortField: string, sortOrder: string): string {
  return sortField ? ` ORDER BY "${sortField}" ${sortOrder}` : "";
}

  // Adds limit clause
function limit(rows: number, first: number): string {
  return rows ? ` LIMIT ${rows} OFFSET ${first}` : "";
}

export {
  addContition,
  where,
  orderBy,
  limit,
};
