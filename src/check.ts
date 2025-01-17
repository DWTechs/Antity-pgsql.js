import { isIn } from "@dwtechs/checkard";
import type { MatchMode, Type } from "./types";

const matchModes = {
  string: ["startsWith", "contains", "endsWith", "notContains", "equals", "notEquals", "lt", "lte", "gt", "gte"],
  number: ["equals", "notEquals", "lt", "lte", "gt", "gte"],
  date: ["is", "isNot", "dateAfter"],
};

function checkMatchMode(type: Type, matchMode: MatchMode): boolean {
  return isIn(matchMode, matchModes[type]);
}

export {
  checkMatchMode,
};
