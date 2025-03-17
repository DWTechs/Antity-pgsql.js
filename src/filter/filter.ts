import * as condition from "./condition";
import type { Filters, Filter, LogicalOperator } from "../types";

const defaultOperator: LogicalOperator = "AND";


function filter(
  first: number,
  rows: number | null | undefined,
  sortOrder: string,
  sortField: string | undefined | null,
  filters: Filters | undefined | null,
): { filterClause: string, args: (Filter["value"])[] } {
  
  const { conditions, args } = condition.add(filters);

  const filterClause = 
      where(conditions) 
    + orderBy(sortField, sortOrder) 
    + limit(rows, first);

  return { filterClause, args };
    
}

// Builds where clause
function where(conditions: string[], operator: LogicalOperator = defaultOperator): string {
  return conditions
    ? ` WHERE ${conditions.join(` ${operator} `).trim()}`
    : "";
}

  // Adds order by clause
function orderBy(sortField: string | undefined | null, sortOrder: string): string {
  return sortField ? ` ORDER BY "${sortField}" ${sortOrder}` : "";
}

  // Adds limit clause
function limit(rows: number | null | undefined, first: number): string {
  return rows ? ` LIMIT ${rows} OFFSET ${first}` : "";
}

export {
  filter,
};
