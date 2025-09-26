import { log } from "@dwtechs/winstan";
import { isIn } from "@dwtechs/checkard";
import * as map from "../map";
import * as check from "../check";
import type { Filters } from "../types";
import { LOGS_PREFIX } from '../constants';  

/**
 * Validates and sanitizes filter criteria by removing invalid properties and incompatible match modes.
 * 
 * This method performs the following validations:
 * - Checks if each filter property exists in the entity's property definitions
 * - Verifies that the match mode is compatible with the SQL data type of the property
 * - Removes any filters that fail validation and logs warnings
 * 
 * @private
 * @param {Filters} filters - The filter object containing property names as keys and filter criteria as values
 * @param {(key: string) => any} getProp - Function to retrieve property definition by key
 * @returns {Filters} A sanitized filter object with only valid filters remaining
 * 
 * @example
 * ```typescript
 * const filters = {
 *   name: { matchMode: 'contains', value: 'John' },
 *   age: { matchMode: 'equals', value: 25 },
 *   invalidProp: { matchMode: 'contains', value: 'test' } // Will be removed
 * };
 * 
 * const cleanedFilters = this.cleanFilters(filters);
 * // Result: { name: { matchMode: 'contains', value: 'John' }, age: { matchMode: 'equals', value: 25 } }
 * ```
 * 
 * @throws {void} Does not throw errors but logs warnings for invalid filters
 * 
 * @see {@link map.type} - For SQL type mapping
 * @see {@link check.matchMode} - For match mode validation
 * @see {@link Entity.getProp} - For property retrieval from parent class
 */
function cleanFilters(filters: Filters, getProp: (key: string) => any): Filters {
  for (const k in filters) {
    if (filters.hasOwnProperty(k)) {
      const prop = getProp(k);
      if (!prop) {
        log.warn(`${LOGS_PREFIX}Filters: skipping unknown property: ${k}`);
        delete filters[k];
        continue;
      }
      if (!prop.filter) {
        log.warn(`${LOGS_PREFIX}Filters: skipping unfilterable property: ${k}`);
        delete filters[k];
        continue;
      }
      const type = map.type(prop.type); // transform from entity type to valid sql filter type
      const { /*subProps, */matchMode } = filters[k];
      if (!matchMode || !check.matchMode(type, matchMode)) { // check if match mode is compatible with sql type
        log.warn(`${LOGS_PREFIX}Filters: skipping invalid match mode: "${matchMode}" for type: "${type}" at property: "${k}"`);
        delete filters[k];
        continue;
      }
    }
  }
  return filters;
}


export {
  cleanFilters,
};
