import * as condition from "./condition";
import type { Filters, Filter, LogicalOperator } from "../types";

function filter(
  first: number = 0,
  rows: number = 0,
  sortOrder: number = -1,
  sortField: string = "",
  filters: Filters | undefined,
): { filterClause: string, args: (Filter["value"])[] } {
  
  const { conditions, args } = condition.add(filters);
  const filterClause = 
      where(conditions) 
    + orderBy(sortField, sortOrder) 
    + limit(rows, first);

  return { filterClause, args };
    
}

// Builds where clause
function where(conditions: string[], operator: LogicalOperator = "AND"): string {
  return conditions
    ? ` WHERE ${conditions.join(` ${operator} `).trim()}`
    : "";
}

  // Adds order by clause
function orderBy(sortField: string, sortOrder: number): string {
  if (!sortField) 
    return "";
  const so = sortOrder === -1 ? "DESC" : "ASC";
  return ` ORDER BY "${sortField}" ${so}`;
}

  // Adds limit clause
function limit(rows: number, first: number): string {
  return rows ? ` LIMIT ${rows} OFFSET ${first}` : "";
}

export {
  filter,
};
