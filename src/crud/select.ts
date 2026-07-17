import { deleteProps } from "@dwtechs/sparray";
import { execute as exe } from "./execute";
import { quoteIfUppercase } from "./quote";
import { filter } from "../filter/filter";
import type { PGResponse, SelectResponse, Filter, Filters, Sort, PGClient, LogicalOperator } from "../types";

export class Select {
  
  private _props: string[] = [];
  private _cols: string = "";
  private _count: string = ", COUNT(*) OVER () AS total";

  public addProp(prop: string): void {
    this._props.push(quoteIfUppercase(prop));
    this._cols = this._props.join(", ");
  }

  public get props(): string {
    return this._cols;
  }

  public query(
    schema: string,
    table: string,
    first: number = 0,
    limit: number | null = null,
    sortField: string | null = null,
    sortOrder: Sort | null = null,
    filters: Filters | null = null,
    operator: LogicalOperator = "AND"
  ): { query: string, args: (Filter["value"])[] } {
    const p = limit ? this._count : '';
    const c = this._cols ? this._cols : '*';
    const baseQuery = `SELECT ${c}${p} FROM ${quoteIfUppercase(schema)}.${quoteIfUppercase(table)}`;
    
    const { filterClause, args } = filter(first, limit, sortField, sortOrder, filters, operator);
    
    return {
      query: baseQuery + filterClause,
      args
    };
  }

  public execute(
    query: string,
    args: (Filter["value"])[],
    client: PGClient | null,
  ): Promise<SelectResponse> {

    return exe(query, args, client)
      .then((r: PGResponse) => {
        if (!r.rowCount)
          throw { status: 404, message: "Resource not found" }; 
        const f = r.rows[0];
        if (f.total) {
          r.total = Number(f.total); // total number of rows without first and rows limits. Useful for pagination. Do not confuse with rowcount
          r.rows = deleteProps(r.rows, ["total"]); // delete "total" property from rows
        }
        return r;
      });
  }

};
