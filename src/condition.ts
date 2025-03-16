import map from "./map";
import type { MatchMode } from "./types";

// Add condition
function add(key: string, index: number, matchMode: MatchMode | undefined ): string { 
  const sqlKey = `\"${key}\"`; // escaped property name for sql query
  const comparator = map.comparator(matchMode);
  const mappedIndex = map.index(index, matchMode);
  return `${sqlKey} ${comparator} ${mappedIndex}`;
}


export {
  add,
};
