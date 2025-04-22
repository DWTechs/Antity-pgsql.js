import { arrayAdd } from "@dwtechs/sparray";
import { execute as exe  } from "./execute";
import { $i } from "./i";
import type { PGResponse, Filter } from "../types";

export class Insert {

  private _props: string[] = ["consumerId", "consumerName"];
  private _cols: string = "*";
  private _nbProps: number = 2;

  public addProp(prop: string): void {
    this._props = arrayAdd(prop, this._props.length - 2);
    // this._props.splice(this._props.length - 2, 0, prop);
    this._cols = this._props.join(", ");
    this._nbProps++;
  }

  /**
   * Generates an SQL INSERT query string and its corresponding arguments for a given table and data rows.
   *
   * @param {string} table - The name of the table where the data will be inserted.
   * @param {Record<string, any>[]} rows - An array of objects representing the rows to be inserted. Each object should contain the properties matching the table columns.
   * @param {string | number} consumerId - The ID of the consumer to be added to each row.
   * @param {string} consumerName - The name of the consumer to be added to each row.
   * @param {string} [rtn] - Optional. A string to append to the query, such as a RETURNING clause. Defaults to an empty string.
   * @returns {{ query: string, args: unknown[] }} An object containing the generated SQL query string and an array of arguments to be used with the query.
   * 
   */
  public query(
    table: string, 
    rows: Record<string, any>[], 
    consumerId: string | number,
    consumerName: string,
    rtn: string = "",
  ): { query: string, args: (Filter["value"])[] } {
    let query = `INSERT INTO "${table}" (${this._cols}) VALUES `;
    const args: (Filter["value"])[] = [];
    let i = 0;
    for (const row of rows) {
      row.consumerId = consumerId;
      row.consumerName = consumerName;
      query += `${$i(this._nbProps, i)}, `;
      for (const prop of this._props) {
        args.push(row[prop]);
      }
      i += this._nbProps;
    }
    query = query.slice(0, -2);
    if (rtn) 
      query += ` ${rtn}`;
    return { query, args };
  } 

  public rtn(prop: string): string {
    return `RETURNING "${prop}"`;
  }

  public execute(
    query: string,
    args: (Filter["value"])[],
    client: any): Promise<PGResponse> {
    
    return exe( query, args, client );

  }

};
