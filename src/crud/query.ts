import { filter } from "../filter/filter";
import type { Filters, Filter, QueryType } from "../types";


function build(
  type: QueryType,
  cols: string,
  table: string,
  first?: number,
  rows?: number,
  sortField?: string,
  sortOrder?: number,
  filters?: Filters,
  rtn?: string,
): { query: string, args: (Filter["value"])[] } {
  
  switch (type) {
    case "SELECT":
      const { filterClause, args } = filter(first, rows, sortOrder, sortField, filters);
      return {
        query: `${type} ${cols} FROM ${table} ${filterClause}`, 
        args
      };   
    case "INSERT":
      const r = rtn ? `RETURNING ${rtn}` : "";
      return {
        query: `INSERT INTO "${table}" (${cols}) VALUES ${$i(args.length)} ${r}`,
        args
      };
    case "UPDATE":
      let query = "";
      for (const q of values) {
        query += `UPDATE "${table}" SET ${q};`;
      }
      return {
        query: "",
        args
      };
    case "DELETE":
      return {
        query: `DELETE FROM "${table}" WHERE id IN ${$i(args.length)}`,
        args
      };
    default:
      return {
        query: "",
        args
      };
  }
}


/**
 * Generates a string representing a sequence of positional parameter placeholders
 * for use in SQL queries.
 *
 * @param qty - The number of placeholders to generate.
 * @returns A string containing the placeholders in the format `($1, $2, ..., $qty)`.
 */
function $i(qty: number): string {
  return `(${Array.from({ length: qty }, (_, i) => `$${i + 1}`).join(", ")})`;
}

export {
  build,
};
