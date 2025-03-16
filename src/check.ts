import { isIn } from "@dwtechs/checkard";
import type { MatchMode, MappedType } from "./types";

const matchModes = {
  string: ["startsWith", "contains", "endsWith", "notContains", "equals", "notEquals", "lt", "lte", "gt", "gte"],
  number: ["equals", "notEquals", "lt", "lte", "gt", "gte"],
  date: ["is", "isNot", "dateAfter"],
};

function matchMode(type: MappedType, matchMode: MatchMode): boolean {
  return isIn(matchModes[type], matchMode);
}

export {
  matchMode,
};
