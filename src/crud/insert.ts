import { execute as exe  } from "./execute";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { PGResponse, Filter } from "../types";

export class Insert {

  private _props: string[] = []; // Original property names for accessing row data
  private _quotedProps: string[] = []; // Quoted property names for SQL columns
  private _nbProps: number = 0; //Cached number of properties
  private _cols: string = ""; // Cached base column string

  public addProp(prop: string): void {
    this._props.push(prop); // Store original name
    this._quotedProps.push(quoteIfUppercase(prop)); // Store quoted name
    this._nbProps++;
    this._cols = this._quotedProps.join(", ");
  }

  /**
   * Generates an SQL INSERT query string and its corresponding arguments for a given table and data rows.
   *
   * @param {string} table - The name of the table where the data will be inserted.
   * @param {Record<string, any>[]} rows - An array of objects representing the rows to be inserted. Each object should contain the properties matching the table columns.
   * @param {string | number} [consumerId] - Optional. The ID of the consumer to be added to each row (for history tracking).
   * @param {string} [consumerName] - Optional. The name of the consumer to be added to each row (for history tracking).
   * @param {string} [rtn] - Optional. A string to append to the query, such as a RETURNING clause. Defaults to an empty string.
   * @returns {{ query: string, args: unknown[] }} An object containing the generated SQL query string and an array of arguments to be used with the query.
   * 
   */
  public query(
    table: string, 
    rows: Record<string, any>[], 
    consumerId?: string | number,
    consumerName?: string,
    rtn: string = "",
  ): { query: string, args: (Filter["value"])[] } {
    // Augment base props template with consumer fields if provided
    const propsToUse = [...this._props]; // Original names for data access
    let nbProps = this._nbProps;
    let cols = this._cols;
    
    if (consumerId !== undefined && consumerName !== undefined) {
      propsToUse.push("consumerId", "consumerName");
      nbProps += 2;
      cols += `, "consumerId", "consumerName"`;
    }
    
    let query = `INSERT INTO ${quoteIfUppercase(table)} (${cols}) VALUES `;
    const args: (Filter["value"])[] = [];
    let i = 0;
    
    for (const row of rows) {
      if (consumerId !== undefined && consumerName !== undefined) {
        row.consumerId = consumerId;
        row.consumerName = consumerName;
      }
      query += `${$i(nbProps, i)}, `;
      for (const prop of propsToUse) {
        args.push(row[prop]); // Access using original property name
      }
      i += nbProps;
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
