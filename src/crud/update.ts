import { execute as exe } from "./execute";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { PGResponse, Filter, Row, PGClient } from "../types";
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
   * @param {string} schema - The name of the schema.
   * @param {string} table - The name of the table where the data will be updated.
   * @param {Record<string, any>[]} rows - An array of objects representing the rows to be updated. Each object should contain an 'id' property.
   * @param {string | number} [consumerId] - Optional. The ID of the consumer, updated as `updaterId` column.
   * @param {string} [consumerName] - Optional. The name of the consumer, updated as `updaterName` column.
   * @returns {{ query: string, args: unknown[] }} An object containing the generated SQL query string and an array of arguments to be used with the query.
   * 
   */
  public query(
    schema: string,
    table: string, 
    rows: Row[],
    consumerId?: string | number,
    consumerName?: string
  ): { query: string, args: (Filter["value"])[] } {
    
    const hasConsumer = consumerId !== undefined && consumerName !== undefined;

    // Augment base props template with consumer fields if provided
    const propsToUse = [...this._props];
    if (hasConsumer)
      propsToUse.push("consumerId", "consumerName");
    
    log.debug(() => `${LOGS_PREFIX}Update query input rows: ${JSON.stringify(rows, null, 2)}`);

    const l = rows.length;
    const args: (Filter["value"])[] = rows.map(row => row.id); // Extract the 'id' field from each row
    let query = `UPDATE ${quoteIfUppercase(schema)}.${quoteIfUppercase(table)} SET `;
    let i = args.length+1;
    
    for (const p of propsToUse) {
      const isConsumerId = p === "consumerId";
      const isConsumerName = p === "consumerName";
      const isConsumerProp = isConsumerId || isConsumerName;

      if (!isConsumerProp && rows[0][p] === undefined) // do not create case if prop is not in the first row
        continue;

      const colName = isConsumerId ? '"updaterId"' : isConsumerName ? '"updaterName"' : quoteIfUppercase(p);
      query += `${colName} = CASE `;
      for (let j = 0; j < l; j++) {
        query += `WHEN id = $${j+1} THEN $${i++} `;
        if (isConsumerId) args.push(consumerId as Filter["value"]);
        else if (isConsumerName) args.push(consumerName as Filter["value"]);
        else args.push(rows[j][p]);
      }
      query += `ELSE ${colName} END, `;
    }
    query = `${query.slice(0, -2)} WHERE id IN ${$i(l, 0)}`;
    return { query, args };
  } 

  public async execute(
    query: string,
    args: (Filter["value"])[],
    client: PGClient | null): Promise<PGResponse> {
    
    return exe( query, args, client );
    
  }
};
