import { execute as exe } from "./execute";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { PGResponse, Filter } from "../types";

export class Upsert {

  private _props: string[] = []; // Original property names for accessing row data
  private _quotedProps: string[] = []; // Quoted property names for SQL columns
  private _nbProps: number = 0; // Cached number of properties
  private _cols: string = ""; // Cached base column string

  public addProp(prop: string): void {
    this._props.push(prop); // Store original name
    this._quotedProps.push(quoteIfUppercase(prop)); // Store quoted name
    this._nbProps++;
    this._cols = this._quotedProps.join(", ");
  }

  /**
   * Generates an SQL UPSERT (INSERT ... ON CONFLICT ... DO UPDATE) query string and its corresponding arguments.
   *
   * @param {string} schema - The name of the schema.
   * @param {string} table - The name of the table where the data will be upserted.
   * @param {Record<string, any>[]} rows - An array of objects representing the rows to be upserted.
   * @param {string | string[]} conflictTarget - The column(s) that define the conflict constraint (e.g., 'id' or ['email', 'username']).
   * @param {string | number} [consumerId] - Optional. The ID of the consumer to be added to each row (for history tracking).
   * @param {string} [consumerName] - Optional. The name of the consumer to be added to each row (for history tracking).
   * @param {string} [rtn] - Optional. A string to append to the query, such as a RETURNING clause. Defaults to an empty string.
   * @returns {{ query: string, args: unknown[] }} An object containing the generated SQL query string and an array of arguments to be used with the query.
   * @throws {Error} If conflictTarget is not provided or is empty.
   * 
   * @example
   * const upsert = new Upsert();
   * upsert.addProp('name');
   * upsert.addProp('email');
   * const { query, args } = upsert.query(
   *   'public',
   *   'users',
   *   [{ id: 1, name: 'John', email: 'john@example.com' }],
   *   'id',
   *   1,
   *   'admin',
   *   'RETURNING id'
   * );
   */
  public query(
    schema: string,
    table: string, 
    rows: Record<string, any>[], 
    conflictTarget: string | string[],
    consumerId?: string | number,
    consumerName?: string,
    rtn: string = "",
  ): { query: string, args: (Filter["value"])[] } {
    if (!conflictTarget || 
        (Array.isArray(conflictTarget) && conflictTarget.length === 0) ||
        (typeof conflictTarget === 'string' && conflictTarget.trim() === '')) {
      throw new Error('conflictTarget must be provided for upsert operation');
    }

    // Augment base props template with consumer fields if provided
    const propsToUse = [...this._props]; // Original names for data access
    const quotedPropsToUse = [...this._quotedProps]; // Quoted names for SQL
    let nbProps = this._nbProps;
    let cols = this._cols;
    
    if (consumerId !== undefined && consumerName !== undefined) {
      propsToUse.push("consumerId", "consumerName");
      quotedPropsToUse.push(`"consumerId"`, `"consumerName"`);
      nbProps += 2;
      cols += `, "consumerId", "consumerName"`;
    }
    
    // Build the conflict target string
    const conflictColumns = Array.isArray(conflictTarget)
      ? conflictTarget.map(col => quoteIfUppercase(col)).join(", ")
      : quoteIfUppercase(conflictTarget);
    
    // Start building the query
    let query = `INSERT INTO ${quoteIfUppercase(schema)}.${quoteIfUppercase(table)} (${cols}) VALUES `;
    const args: (Filter["value"])[] = [];
    let i = 0;
    
    // Add all rows to the VALUES clause
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
    
    // Add ON CONFLICT clause
    query += ` ON CONFLICT (${conflictColumns}) DO UPDATE SET `;
    
    // Build the UPDATE SET clause (exclude conflict target columns from being updated)
    const conflictTargetArray = Array.isArray(conflictTarget) ? conflictTarget : [conflictTarget];
    const updateCols = quotedPropsToUse.filter((_, idx) => {
      const propName = propsToUse[idx];
      return !conflictTargetArray.includes(propName);
    });
    
    for (const col of updateCols) {
      query += `${col} = EXCLUDED.${col}, `;
    }
    
    query = query.slice(0, -2);
    
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
    client: any): Promise<PGResponse> {
    
    return exe( query, args, client );

  }

}
