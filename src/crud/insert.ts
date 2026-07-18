import { execute as exe  } from "./execute";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { PGResponse, Filter, Row, PGClient } from "../types";

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
   * @param {string} schema - The name of the schema.
   * @param {string} table - The name of the table where the data will be inserted.
   * @param {Record<string, any>[]} rows - An array of objects representing the rows to be inserted. Each object should contain the properties matching the table columns.
   * @param {string | number} [creatorId] - Optional. The ID of the consumer, inserted as `creatorId` column.
   * @param {string} [creatorName] - Optional. The name of the consumer, inserted as `creatorName` column.
   * @param {string} [rtn] - Optional. A string to append to the query, such as a RETURNING clause. Defaults to an empty string.
   * @returns {{ query: string, args: unknown[] }} An object containing the generated SQL query string and an array of arguments to be used with the query.
   * 
   */
  public query(
    schema: string,
    table: string, 
    rows: Row[], 
    creatorId?: string | number,
    creatorName?: string,
    rtn: string = "",
  ): { query: string, args: (Filter["value"])[] } {
    // Augment base props template with consumer fields if provided
    const propsToUse = [...this._props]; // Original names for data access
    let nbProps = this._nbProps;
    let cols = this._cols;
    
    if (creatorId !== undefined && creatorName !== undefined) {
      propsToUse.push("creatorId", "creatorName");
      nbProps += 2;
      cols += `, "creatorId", "creatorName"`;
    }
    
    const args: (Filter["value"])[] = [];
    const valueParts: string[] = [];
    let i = 0;
    
    for (const row of rows) {
      valueParts.push($i(nbProps, i));
      for (const prop of propsToUse) {
        if (prop === "creatorId") args.push(creatorId as Filter["value"]);
        else if (prop === "creatorName") args.push(creatorName as Filter["value"]);
        else args.push(row[prop]); // Access using original property name
      }
      i += nbProps;
    }
    
    let query = `INSERT INTO ${quoteIfUppercase(schema)}.${quoteIfUppercase(table)} (${cols}) VALUES ${valueParts.join(", ")}`;
    if (rtn) 
      query += ` ${rtn}`;
    return { query, args };
  } 

  public rtn(prop: string): string {
    return `RETURNING ${quoteIfUppercase(prop)}`;
  }

  public execute(
    query: string,
    args: (Filter["value"])[],
    client: PGClient | null): Promise<PGResponse> {
    
    return exe( query, args, client );

  }

};
