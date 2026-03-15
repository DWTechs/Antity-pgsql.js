import { mapIndexes } from "./map/index";
import { mapComparator } from "./map/comparator";
import { quoteIfUppercase } from "../crud/quote";
import type { MatchMode, Filters, Filter } from "../types";
import { isArray, isString } from "@dwtechs/checkard";

/**
 * Formats a value by adding wildcards based on match mode.
 *
 * @param {Filter["value"]} value - The value to format.
 * @param {MatchMode | undefined} matchMode - The mode of matching to be applied.
 * @returns {Filter["value"]} The formatted value with wildcards if applicable.
 * @example
 * // Returns "abc%"
 * formatValue("abc", "startsWith");
 * @example
 * // Returns "%abc"
 * formatValue("abc", "endsWith");
 * @example
 * // Returns "%abc%"
 * formatValue("abc", "contains");
 */
function formatValue(value: Filter["value"], matchMode: MatchMode | undefined): Filter["value"] {
  if (!isString(value))
    return value;
  
  switch (matchMode) {
    case "startsWith":
      return `${value}%`;
    case "endsWith":
      return `%${value}`;
    case "contains":
    case "notContains":
      return `%${value}%`;
    default:
      return value;
  }
}

function add(filters: Filters | null ): 
  { conditions: string[], args: (Filter["value"])[] } 
{
  const conditions: string[] = [];
  const args: (Filter["value"])[] = [];
  if (filters) {
    let i = 1;
    for (const k in filters) {
      const filterValue = filters[k];
      // Normalize to array format (handle both old and new formats)
      const filterArray = isArray(filterValue) ? filterValue : [filterValue];
      const groupConditions: string[] = [];
      
      // Process each filter in the array for this property
      for (const filter of filterArray) {
        const { value, matchMode } = filter;
        const indexes: number[] = isArray(value) ? value.map(() => i++) : [i++];
        const cond = addOne(k, indexes, matchMode);
        if (cond) {
          groupConditions.push(cond);
          if (isArray(value))
            args.push(...value.map((v: number) => formatValue(v, matchMode)));  
          else
            args.push(formatValue(value, matchMode));
        }
      }
      
      // Combine multiple filters for the same property with the operator
      if (groupConditions.length > 0) {
        const operator = filterArray[0]?.operator?.toUpperCase() || 'AND';
        const combined = groupConditions.length > 1 
          ? `(${groupConditions.join(` ${operator} `)})`
          : groupConditions[0];
        conditions.push(combined);
      }
    }
  }
  return { conditions, args };
}

// Add condition
function addOne(
  key: string, 
  indexes: number[],
  matchMode: MatchMode | undefined 
): string { 
  const sqlKey = `${quoteIfUppercase(key)}`; // escaped property name for sql query
  const comparator = mapComparator(matchMode);
  const index = mapIndexes(indexes, matchMode);
  return comparator ? `${sqlKey} ${comparator} ${index}` : "";
}

export {
  add as addConditions,
};
