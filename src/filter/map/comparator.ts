
import type { MatchMode, Comparator } from "../../types";

const COMPARATORS: readonly Comparator[] = ["=", "<", ">", "<=", ">=", "<>", "IS", "IS NOT", "IN", "NOT IN", "LIKE", "NOT LIKE"];

/**
 * Returns the SQL comparator string based on the provided match mode.
 *
 * @param matchMode - The match mode to determine the comparator. Accepts semantic match modes or direct SQL comparators.
 *
 * @returns The corresponding SQL comparator string or null if the match mode is undefined or not recognized.
 */
function comparator(matchMode: MatchMode | undefined): Comparator| null {
  if (matchMode && (COMPARATORS as readonly string[]).includes(matchMode))
    return matchMode as Comparator;

  switch (matchMode) {
    case "startsWith":
      return "LIKE";
    case "endsWith":
      return "LIKE";
    case "contains":
      return "LIKE";
    case "notContains":
      return "NOT LIKE";
    case "equals": 
      return "=";
    case "notEquals":
      return "<>";
    case "in":
      return "IN";
    case "notIn":
      return "NOT IN";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "gt":
      return ">";
    case "gte":
      return ">=";
    case "is":
      return "IS";
    case "isNot":
      return "IS NOT";
    case "before":
      return "<";
    case "after":
      return ">";
    default:
      return null;
  }
}

export {
  comparator as mapComparator,
  COMPARATORS,
};
