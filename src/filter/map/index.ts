import { isArray, isInteger } from "@dwtechs/checkard";
import type { MatchMode } from "../../types";

/**
 * Generates a SQL pattern string based on the provided match mode.
 *
 * @param i - The index to be used in the pattern string.
 * @param matchMode - The mode of matching to be applied.
 * @param value - The value associated with the match mode (used for type casting).
 * @returns A string representing the SQL pattern based on the provided match mode.
 * @example
 * // Returns "$1,$2"
 * index([1, 2], undefined, null);
 * @example
 * // Returns "($1,$2)"
 * index([1, 2], "in", null);
 * @example
 * // Returns "($1,$2)"
 * index([1, 2], "IN", null);
 */
function index(index: number[], matchMode: MatchMode | undefined, value: unknown): string {
  const i = index.map((i: number) => `$${i}`);
  switch (matchMode) {
    case "in":
    case "notIn":
    case "IN":
    case "NOT IN":
      return `(${i})`;
    case "&&": {
      const cast = isArray(value, ">", 0) && isInteger(value[0]) ? '::integer[]' : '';
      return `ARRAY[${i}]${cast}`;
    }
    default:
      return `${i}`;
  }
}

export {
  index as mapIndexes,
};
