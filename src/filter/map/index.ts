
import type { MatchMode } from "../../types";

/**
 * Generates a SQL pattern string based on the provided match mode.
 *
 * @param i - The index to be used in the pattern string.
 * @param matchMode - The mode of matching to be applied.
 * @returns A string representing the SQL pattern based on the provided match mode.
 */
function index(index: number[], matchMode: MatchMode | undefined): string {
  const i = index.map((i: number) => `$${i}`) ;
  switch (matchMode) {
    case "startsWith":
      return `${i}%`;
    case "endsWith":
      return `%${i}`;
    case "contains":
      return `%${i}%`;
    case "notContains":
      return `%${i}%`;
    case "in":
      return `(${i})`;
    default:
      return `${i}`;
  }
}

export {
  index as mapIndexes,
};
