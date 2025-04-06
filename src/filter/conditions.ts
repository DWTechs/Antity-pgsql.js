import * as map from "../map";
import type { MatchMode, Filters, Filter } from "../types";


function add(filters: Filters | null ): 
  { conditions: string[], args: (Filter["value"])[] } 
{
  const conditions: string[] = [];
  const args: (Filter["value"])[] = [];
  if (filters) {
    let i = 1;
    for (const k in filters) {
      const { value, /*subProps, */matchMode } = filters[k];
      conditions.push(addOne(k, i, matchMode));
      args.push(value);
      i++;
    }
  }

  return { conditions, args };

}

// Add condition
function addOne(
  key: string, 
  index: number, 
  matchMode: MatchMode | undefined 
): string { 
  const sqlKey = `\"${key}\"`; // escaped property name for sql query
  const comparator = map.comparator(matchMode);
  const mappedIndex = map.index(index, matchMode);
  return `${sqlKey} ${comparator} ${mappedIndex}`;
}

export {
  add,
};
