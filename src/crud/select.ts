import { log } from "@dwtechs/winstan";
import { getPropertyType } from "@dwtechs/antity";
import * as map from "../map";
import * as check from "../check";
import * as condition from "../condition";
import type { Filters, Filter, LogicalOperator } from "../types";

const defaultOperator: LogicalOperator = "AND";


function filter(
  first: number,
  rows: number | null | undefined,
  sortOrder: string,
  sortField: string | undefined | null,
  filters: Filters | undefined | null,
): { filterClause: string, args: (Filter["value"])[] } {
  
  const { conditions, args } = getConditions(filters);

  const filterClause = 
      where(conditions) 
    + orderBy(sortField, sortOrder) 
    + limit(rows, first);

  return { filterClause, args };
    
}

function getConditions(filters: Filters | undefined | null ): { conditions: string[], args: (Filter["value"])[] } {
  let i = 1;
  const conditions: string[] = [];
  const args: (Filter["value"])[] = [];
  for (const k in filters) {
    const propType = getPropertyType(k);
    if (!propType) {
      log.warn(`Skipping unknown property: ${k}`);
      continue;
    }
    
    const type = map.type(propType); // transform from entity type to valid sql filter type
    const { value, /*subProps, */matchMode } = filters[k];
    
    if (!matchMode || !check.matchMode(type, matchMode)) { // check if match mode is compatible with sql type
      log.warn(`Skipping invalid match mode: "${matchMode}" for type: "${type}" at property: "${k}"`);
      continue;
    }

    conditions.push(condition.add(k, i, matchMode));
    args.push(value);
    i++;
  }

  return { conditions, args };

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
