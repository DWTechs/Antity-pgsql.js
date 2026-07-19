import { mapIndexes } from "./map/index";
import { mapComparator } from "./map/comparator";
import { quoteIfUppercase } from "../crud/quote";
import type { MatchMode, Filters, SqlValue } from "../types";
import { isArray, isString } from "@dwtechs/checkard";

/**
 * Formats a value by adding wildcards based on match mode.
 *
 * @param {SqlValue} value - The value to format.
 * @param {MatchMode | undefined} matchMode - The mode of matching to be applied.
 * @returns {SqlValue} The formatted value with wildcards if applicable.
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
function formatValue(value: SqlValue, matchMode: MatchMode | undefined): SqlValue {
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

/**
 * Checks if a filter value should be skipped (empty or null).
 *
 * @param {SqlValue} value - The value to check.
 * @param {MatchMode | undefined} matchMode - The mode of matching to be applied.
 * @returns {boolean} True if the value should be skipped, false otherwise.
 * @example
 * // Returns true
 * shouldSkipValue('', 'contains');
 * @example
 * // Returns true
 * shouldSkipValue([], 'in');
 * @example
 * // Returns false (null is allowed for IS/IS NOT)
 * shouldSkipValue(null, 'is');
 */
function shouldSkipValue(value: SqlValue, matchMode: MatchMode | undefined): boolean {
  // Empty strings should be skipped
  if (isString(value, "0"))
    return true;
  
  // Empty arrays should be skipped
  if (isArray(value, "0"))
    return true;
  
  // Null values should be skipped except for IS and IS NOT match modes
  if (value === null && matchMode !== 'is' && matchMode !== 'isNot' && matchMode !== 'IS' && matchMode !== 'IS NOT')
    return true;
  
  return false;
}

function add(filters: Filters | null ): 
  { conditions: string[], args: SqlValue[] } 
{
  const conditions: string[] = [];
  const args: SqlValue[] = [];
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
        
        // Skip filters with empty or null values
        if (shouldSkipValue(value, matchMode))
          continue;
        
        // IS / IS NOT against NULL or a boolean must use a literal
        // ("col IS NULL" / "col IS TRUE" / "col IS FALSE"), not a bind
        // parameter - PostgreSQL's IS operator only accepts the NULL/TRUE/
        // FALSE/UNKNOWN keywords on its right side, never a $n placeholder.
        // So this branch doesn't consume a placeholder index nor push
        // anything to args.
        if (isIsMatchMode(matchMode) && isIsLiteralValue(value)) {
          const cond = addOneLiteral(k, matchMode, value);
          if (cond)
            groupConditions.push(cond);
          continue;
        }
        
        const indexes: number[] = isArray(value) ? value.map(() => i++) : [i++];
        const cond = addOne(k, indexes, matchMode, value);
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

/**
 * Checks whether a match mode maps to the SQL "IS" / "IS NOT" comparator.
 *
 * @param {MatchMode | undefined} matchMode - The mode of matching to be applied.
 * @returns {boolean} True if the match mode is "is", "isNot", "IS" or "IS NOT".
 * @example
 * // Returns true
 * isIsMatchMode("is");
 * @example
 * // Returns false
 * isIsMatchMode("equals");
 */
function isIsMatchMode(matchMode: MatchMode | undefined): boolean {
  return matchMode === 'is' || matchMode === 'isNot' || matchMode === 'IS' || matchMode === 'IS NOT';
}

/**
 * Checks whether a value must be rendered as a SQL literal (NULL/TRUE/FALSE)
 * when used with the IS / IS NOT comparator, instead of a bind parameter.
 *
 * @param {SqlValue} value - The value to check.
 * @returns {boolean} True if value is null, true or false.
 * @example
 * // Returns true
 * isIsLiteralValue(null);
 * @example
 * // Returns true
 * isIsLiteralValue(false);
 * @example
 * // Returns false
 * isIsLiteralValue("John");
 */
function isIsLiteralValue(value: SqlValue): value is boolean | null {
  return value === null || value === true || value === false;
}

/**
 * Builds an "IS NULL" / "IS NOT NULL" / "IS TRUE" / "IS NOT FALSE" condition
 * with the NULL/TRUE/FALSE keyword inlined as a literal rather than bound as
 * a query parameter, since PostgreSQL's IS operator doesn't accept a $n
 * placeholder on its right side.
 *
 * @param {string} key - The property/column name.
 * @param {MatchMode | undefined} matchMode - "is"/"IS" or "isNot"/"IS NOT".
 * @param {boolean | null} value - null, true or false.
 * @returns {string} The SQL condition, e.g. `"userId" IS NULL`, or "" if the
 * match mode doesn't map to a comparator.
 * @example
 * // Returns '"userId" IS NULL'
 * addOneLiteral("userId", "is", null);
 * @example
 * // Returns '"archived" IS NOT FALSE'
 * addOneLiteral("archived", "isNot", false);
 */
function addOneLiteral(key: string, matchMode: MatchMode | undefined, value: boolean | null): string {
  const sqlKey = `${quoteIfUppercase(key)}`;
  const comparator = mapComparator(matchMode);
  const literal = value === null ? "NULL" : value ? "TRUE" : "FALSE";
  return comparator ? `${sqlKey} ${comparator} ${literal}` : "";
}

// Add condition
function addOne(
  key: string, 
  indexes: number[],
  matchMode: MatchMode | undefined,
  value: unknown
): string { 
  const sqlKey = `${quoteIfUppercase(key)}`; // escaped property name for sql query
  const comparator = mapComparator(matchMode);
  const index = mapIndexes(indexes, matchMode, value);
  return comparator ? `${sqlKey} ${comparator} ${index}` : "";
}

export {
  add as addConditions,
};
