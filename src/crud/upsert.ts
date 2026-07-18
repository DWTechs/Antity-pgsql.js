import { isArray, isString } from "@dwtechs/checkard";
import { execute as exe } from "./execute";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { PGResponse, Filter, Row, PGClient } from "../types";

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
   * @param {string | number} [userId] - Optional. The ID of the consumer. Inserted as `creatorId` on INSERT, and as `updaterId` on CONFLICT UPDATE.
   * @param {string} [userName] - Optional. The name of the consumer. Inserted as `creatorName` on INSERT, and as `updaterName` on CONFLICT UPDATE.
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
    rows: Row[], 
    conflictTarget: string | string[],
    userId?: string | number,
    userName?: string,
    rtn: string = "",
  ): { query: string, args: (Filter["value"])[] } {
    if (!isArray(conflictTarget, '!0') && !isString(conflictTarget, '!0'))
      throw new Error('conflictTarget must be provided for upsert operation');

    // Augment base props template with consumer fields if provided
    let nbProps = this._nbProps;
    let cols = this._cols;
    
    if (userId !== undefined && userName !== undefined) {
      nbProps += 2;
      cols += `, "creatorId", "creatorName"`;
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
      query += `${$i(nbProps, i)}, `;
      for (const prop of this._props) {
        args.push(row[prop]);
      }
      if (userId !== undefined && userName !== undefined)
        args.push(userId, userName);
      
      i += nbProps;
    }
    
    query = query.slice(0, -2);
    
    // Add ON CONFLICT clause
    // Build the UPDATE SET clause from the entity's own props only (exclude conflict
    // target columns from being updated). Audit columns are handled separately below,
    // since "creatorId"/"creatorName" must never be overwritten on an existing row.
    const conflictTargetArray = Array.isArray(conflictTarget) ? conflictTarget : [conflictTarget];
    const updateCols = this._quotedProps.filter((_, idx) => {
      const propName = this._props[idx];
      return !conflictTargetArray.includes(propName);
    });
    
    const setClauses = updateCols.map(col => `${col} = EXCLUDED.${col}`);
    // On conflict (i.e. an UPDATE), record the consumer as the updater, not the
    // creator: "creatorId"/"creatorName" stay untouched on the existing row, while
    // EXCLUDED."creatorId"/"creatorName" (the values that would have been inserted)
    // are written into "updaterId"/"updaterName" instead.
    if (userId !== undefined && userName !== undefined)
      setClauses.push(`"updaterId" = EXCLUDED."creatorId"`, `"updaterName" = EXCLUDED."creatorName"`);
    
    query += ` ON CONFLICT (${conflictColumns}) DO UPDATE SET ${setClauses.join(", ")}`;
    
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

}
