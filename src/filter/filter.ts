import * as condition from "./conditions";
import type { Filters, Filter, Sort, LogicalOperator } from "../types";

function filter(
  first: number,
  rows: number | null,
  sortField: string | null,
  sortOrder: Sort,
  filters: Filters | null,
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
  const c = conditions.join(` ${operator} `).trim();
  return conditions ? ` WHERE ${c}` : "";
}

// Adds order by clause
function orderBy(sortField: string | null, sortOrder: Sort): string {
  if (!sortField) 
    return "";
  return ` ORDER BY "${sortField}" ${sortOrder}`;
}

// Adds limit clause
function limit(rows: number | null, first: number): string {
  return rows ? ` LIMIT ${rows} OFFSET ${first}` : "";
}

export {
  filter,
};
