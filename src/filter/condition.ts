import { mapIndexes } from "./map/index";
import { mapComparator } from "./map/comparator";
import { quoteIfUppercase } from "../crud/quote";
import type { MatchMode, Filters, Filter } from "../types";
import { isArray } from "@dwtechs/checkard";

function add(filters: Filters | null ): 
  { conditions: string[], args: (Filter["value"])[] } 
{
  const conditions: string[] = [];
  const args: (Filter["value"])[] = [];
  if (filters) {
    let i = 1;
    for (const k in filters) {
      const filterValue = filters[k];
      // Normalize to array format (handle both old and new formats)
      const filterArray = isArray(filterValue) ? filterValue : [filterValue];
      const groupConditions: string[] = [];
      
      // Process each filter in the array for this property
      for (const filter of filterArray) {
        const { value, matchMode } = filter;
        const indexes: number[] = isArray(value) ? value.map(() => i++) : [i++];
        const cond = addOne(k, indexes, matchMode);
        if (cond) {
          groupConditions.push(cond);
          if (isArray(value))
            args.push(...value);  
          else
            args.push(value);
        }
      }
      
      // Combine multiple filters for the same property with the operator
      if (groupConditions.length > 0) {
        const operator = filterArray[0]?.operator?.toUpperCase() || 'AND';
        const combined = groupConditions.length > 1 
          ? `(${groupConditions.join(` ${operator} `)})`
          : groupConditions[0];
        conditions.push(combined);
      }
    }
  }
  return { conditions, args };
}

// Add condition
function addOne(
  key: string, 
  indexes: number[],
  matchMode: MatchMode | undefined 
): string { 
  const sqlKey = `${quoteIfUppercase(key)}`; // escaped property name for sql query
  const comparator = mapComparator(matchMode);
  const index = mapIndexes(indexes, matchMode);
  return comparator ? `${sqlKey} ${comparator} ${index}` : "";
}

export {
  add as addConditions,
};
