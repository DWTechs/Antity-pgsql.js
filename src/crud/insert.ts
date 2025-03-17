import { log } from "@dwtechs/winstan";
import { getPropertyType } from "@dwtechs/antity";
import * as map from "../map";
import * as check from "../check";
import * as condition from "../filter/condition";
import type { Filters, Filter, LogicalOperator } from "../types";

const defaultOperator: LogicalOperator = "AND";

function add(table: string, cols: string, values: string, args: (Filter["value"])[], rtn: string, client: any): Promise<any> {
  const chunks = chunk(req.body.rows);

  // return execute(query, args, client);
}

export {
  add,
};
