import { addConditions } from "./condition";
import { quoteIfUppercase } from "../crud/quote";
import type { Filters, Filter, Sort, LogicalOperator } from "../types";

function filter(
  first: number,
  rows: number | null,
  sortField: string | null,
  sortOrder: Sort | null,
  filters: Filters | null,
): { filterClause: string, args: (Filter["value"])[] } {
  
  const { conditions, args } = addConditions(filters);
  const filterClause = 
      where(conditions) 
    + orderBy(sortField, sortOrder) 
    + limit(rows, first);

  return { filterClause, args };
    
}

// Builds where clause
function where(conditions: string[], operator: LogicalOperator = "AND"): string {
  if (!conditions.length) 
    return "";
  // Join conditions with the operator
  // and trim any extra spaces
  const c = conditions.join(` ${operator} `).trim();
  return ` WHERE ${c}`;
}

// Adds order by clause
function orderBy(sortField: string | null, sortOrder: Sort | null): string {
  if (!sortField) 
    return "";
  const o = sortOrder || "ASC";
  return ` ORDER BY ${quoteIfUppercase(sortField)} ${o}`;
}

// Adds limit clause
function limit(rows: number | null, first: number): string {
  return rows ? ` LIMIT ${rows} OFFSET ${first}` : "";
}

export {
  filter,
};
