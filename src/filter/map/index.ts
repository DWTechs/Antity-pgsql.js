
import type { MatchMode } from "../../types";

/**
 * Generates a SQL pattern string based on the provided match mode.
 *
 * @param i - The index to be used in the pattern string.
 * @param matchMode - The mode of matching to be applied.
 * @returns A string representing the SQL pattern based on the provided match mode.
 * @example
 * // Returns "$1,$2"
 * index([1, 2], undefined);
 * @example
 * // Returns "($1,$2)"
 * index([1, 2], "in");
 */
function index(index: number[], matchMode: MatchMode | undefined): string {
  const i = index.map((i: number) => `$${i}`);
  switch (matchMode) {
    case "in":
      return `(${i})`;
    default:
      return `${i}`;
  }
}

export {
  index as mapIndexes,
};
