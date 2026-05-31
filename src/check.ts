import type { MatchMode, MappedType, Comparator } from "./types";
import { COMPARATORS } from "./filter/map/comparator";

const matchModes = {
  string: new Set(["startsWith", "contains", "endsWith", "notContains", "equals", "notEquals", "lt", "lte", "gt", "gte", "in", "notIn"]),
  number: new Set(["equals", "notEquals", "lt", "lte", "gt", "gte", "in", "notIn"]),
  date: new Set(["is", "isNot", "dateAfter"]),
  array: new Set(["&&"]),
};

function matchMode(type: MappedType, matchMode: MatchMode): boolean {
  return COMPARATORS.has(matchMode as Comparator) || matchModes[type].has(matchMode);
}

export {
  matchMode,
};
