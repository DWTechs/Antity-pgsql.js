import { mapIndexes } from "./map/index";
import { mapComparator } from "./map/comparator";
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
      const { value, /*subProps, */matchMode } = filters[k];
      const indexes: number[] = isArray(value) ? value.map(() => i++) : [i++];
      const cond = addOne(k, indexes, matchMode);
      if (cond) {
        conditions.push(cond);
        if (isArray(value))
          args.push(...value);  
        else
          args.push(value);
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
  const sqlKey = `\"${key}\"`; // escaped property name for sql query
  const comparator = mapComparator(matchMode);
  const index = mapIndexes(indexes, matchMode);
  return comparator ? `${sqlKey} ${comparator} ${index}` : "";
}

export {
  add as addConditions,
};
