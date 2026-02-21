import { execute as exe } from "./execute";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { PGResponse, Filter } from "../types";
import { log } from "@dwtechs/winstan";
import { LOGS_PREFIX } from "../constants";

export class Update {
  private _props: string[] = []; // Base template of properties, augmented with consumer fields when needed

  public addProp(prop: string): void {
    this._props.push(prop);
  }

  /**
   * Generates an SQL UPDATE query string and its corresponding arguments for a given table and data rows.
   *
   * @param {string} table - The name of the table where the data will be updated.
   * @param {Record<string, any>[]} rows - An array of objects representing the rows to be updated. Each object should contain an 'id' property.
   * @param {string | number} [consumerId] - Optional. The ID of the consumer to be added to each row (for history tracking).
   * @param {string} [consumerName] - Optional. The name of the consumer to be added to each row (for history tracking).
   * @returns {{ query: string, args: unknown[] }} An object containing the generated SQL query string and an array of arguments to be used with the query.
   * 
   */
  public query(
    table: string, 
    rows: Record<string, any>[],
    consumerId?: string | number,
    consumerName?: string
  ): { query: string, args: (Filter["value"])[] } {
    
    // Add consumer fields to rows if provided
    if (consumerId !== undefined && consumerName !== undefined)
      rows = this.addConsumer(rows, consumerId, consumerName);
    
    // Augment base props template with consumer fields if provided
    const propsToUse = [...this._props]; // Quoted names for SQL columns
    if (consumerId !== undefined && consumerName !== undefined)
      propsToUse.push("consumerId", "consumerName");
    
    log.debug(`${LOGS_PREFIX}Update query input rows: ${JSON.stringify(rows, null, 2)}`);

    const l = rows.length;
    const args: (Filter["value"])[] = rows.map(row => row.id); // Extract the 'id' field from each row;
    let query = `UPDATE "${quoteIfUppercase(table)}" SET `;
    let i = args.length+1;
    
    for (const p of propsToUse) {
      if (rows[0][p] === undefined) // do not create case if prop is not in the first row
        continue;
      query += `${quoteIfUppercase(p)} = CASE `;
      for (let j = 0; j < l; j++) {
        const row = rows[j];
        query += `WHEN id = $${j+1} THEN $${i++} `;
        args.push(row[p]);
      }
      query += `ELSE ${quoteIfUppercase(p)} END, `;
    }
    query = `${query.slice(0, -2)} WHERE id IN ${$i(l, 0)}`;
    return { query, args };
  } 

  public async execute(
    query: string,
    args: (Filter["value"])[],
    client: any): Promise<PGResponse> {
    
    return exe( query, args, client );
    
  }

  // Add consumerId and consumerName to each row
  private  addConsumer(
    rows: Record<string, unknown>[],
    consumerId: string | number,
    consumerName: string
  ): Record<string, unknown>[] {
    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      consumerId,
      consumerName,
    }));
  }
};
