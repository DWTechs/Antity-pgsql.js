import { log } from "@dwtechs/winstan";
import { getPropertyType } from "@dwtechs/antity";
import * as map from "../map";
import * as check from "../check";
import type { MatchMode, Filters, Filter } from "../types";


function add(filters: Filters | undefined | null ): { conditions: string[], args: (Filter["value"])[] } {
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

    conditions.push(addOne(k, i, matchMode));
    args.push(value);
    i++;
  }

  return { conditions, args };

}

// Add condition
function addOne(key: string, index: number, matchMode: MatchMode | undefined ): string { 
  const sqlKey = `\"${key}\"`; // escaped property name for sql query
  const comparator = map.comparator(matchMode);
  const mappedIndex = map.index(index, matchMode);
  return `${sqlKey} ${comparator} ${mappedIndex}`;
}

export {
  add,
};
