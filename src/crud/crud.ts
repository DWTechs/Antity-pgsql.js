import { deleteProps } from "@dwtechs/sparray";
import type { PGResponse, Response, Filter } from "../types";
import { execute } from "./execute";

function select( query: string, args: (Filter["value"])[]): Promise<Response> {

  return execute(query, args, null)
    .then((r: PGResponse) => {
      if (!r.rowCount)
        throw { status: 404, msg: "Resource not found" }; 
      const f = r.rows[0];
      if (f?.total) {
        r.total = Number(f.total); // total number of rows without first and rows limits. Useful for pagination. Do not confuse with rowcount
        r.rows = deleteProps(r.rows, ["total"]); // delete "total" property from rows
      }
      return r;
    });
}

export {
  select,
};
