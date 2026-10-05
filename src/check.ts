import type { MatchMode, MappedType } from "./types";

const matchModes = {
  string: new Set(["startsWith", "contains", "endsWith", "notContains", "equals", "notEquals", "!=", "lt", "lte", "gt", "gte", "in", "notIn",
                    "=", "<>", "<", "<=", ">", ">=", "IN", "NOT IN", "LIKE", "NOT LIKE", "IS", "IS NOT", "is", "isNot"]),
  number: new Set(["equals", "notEquals", "!=", "lt", "lte", "gt", "gte", "in", "notIn",
                    "=", "<>", "<", "<=", ">", ">=", "IN", "NOT IN", "is", "isNot", "IS", "IS NOT"]),
  date: new Set(["is", "isNot", "before", "after", "dateIs", "dateIsNot", "dateBefore", "dateAfter",
                  "IS", "IS NOT", "<", ">"]),
  array: new Set(["&&"]),
  boolean: new Set(["is", "isNot", "IS", "IS NOT"]),
};

function matchMode(type: MappedType, matchMode: MatchMode): boolean {
  return matchModes[type].has(matchMode);
}

export {
  matchMode,
};
