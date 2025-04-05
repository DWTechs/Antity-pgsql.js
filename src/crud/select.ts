import { deleteProps } from "@dwtechs/sparray";
import { execute } from "./execute";
import { filter } from "../filter/filter";
import type { PGResponse, Response, Filters, Sort } from "../types";

function select(
  cols: string,
  table: string,
  first: number,
  rows: number | null,
  sortField: string | null,
  sortOrder: Sort,
  filters: Filters | null,
): Promise<Response> {
    
  const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);
  const query = `SELECT ${cols} FROM ${table} ${filterClause}`;

  return execute(query, args, null)
    .then((r: PGResponse) => {
      if (!r.rowCount)
        throw { status: 404, msg: "Resource not found" }; 
      const f = r.rows[0];
      if (f.total) {
        r.total = Number(f.total); // total number of rows without first and rows limits. Useful for pagination. Do not confuse with rowcount
        r.rows = deleteProps(r.rows, ["total"]); // delete "total" property from rows
      }
      return r;
    });
}

export {
  select,
};
