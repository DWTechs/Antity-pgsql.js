import { execute as exe } from "./execute";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { PGResponse, SqlValue, Row, PGClient } from "../types";
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
   * Rows do not need to share the same set of properties: a column is included in the query as soon as
   * at least one row provides a value for it, and rows that omit a given property keep their current
   * database value for that column (they are not overwritten with NULL).
   *
   * @param {string} schema - The name of the schema.
   * @param {string} table - The name of the table where the data will be updated.
   * @param {Record<string, any>[]} rows - An array of objects representing the rows to be updated. Each object should contain an 'id' property. Properties may be omitted on a per-row basis to leave that column untouched for that row.
   * @param {string | number} [updaterId] - Optional. The ID of the consumer, updated as `updaterId` column.
   * @param {string} [updaterName] - Optional. The name of the consumer, updated as `updaterName` column.
   * @returns {{ query: string, args: unknown[] }} An object containing the generated SQL query string and an array of arguments to be used with the query.
   * 
   */
  public query(
    schema: string,
    table: string, 
    rows: Row[],
    updaterId?: string | number,
    updaterName?: string
  ): { query: string, args: SqlValue[] } {
    
    const hasConsumer = updaterId !== undefined && updaterName !== undefined;

    // Augment base props template with consumer fields if provided
    const propsToUse = [...this._props];
    if (hasConsumer)
      propsToUse.push("updaterId", "updaterName");
    
    log.debug(() => `${LOGS_PREFIX}Update query input rows: ${JSON.stringify(rows, null, 2)}`);

    const l = rows.length;
    const args: SqlValue[] = rows.map(row => row.id); // Extract the 'id' field from each row
    let i = args.length+1;
    const setClauses: string[] = [];
    
    for (const p of propsToUse) {
      const isUpdaterId = p === "updaterId";
      const isUpdaterName = p === "updaterName";
      const isUpdaterProp = isUpdaterId || isUpdaterName;

      // Include the column as soon as ANY row in the batch provides a value for it
      if (!isUpdaterProp && !rows.some(row => row[p] !== undefined))
        continue;

      const colName = isUpdaterId ? '"updaterId"' : isUpdaterName ? '"updaterName"' : quoteIfUppercase(p);
      const whenParts: string[] = [];
      for (let j = 0; j < l; j++) {
        // Rows that omit this prop keep their current value (no WHEN -> falls through to ELSE colName)
        if (!isUpdaterProp && rows[j][p] === undefined)
          continue;
        whenParts.push(`WHEN id = $${j+1} THEN $${i++}`);
        if (isUpdaterId) args.push(updaterId as SqlValue);
        else if (isUpdaterName) args.push(updaterName as SqlValue);
        else args.push(rows[j][p]);
      }
      setClauses.push(`${colName} = CASE ${whenParts.join(" ")} ELSE ${colName} END`);
    }
    const query = `UPDATE ${quoteIfUppercase(schema)}.${quoteIfUppercase(table)} SET ${setClauses.join(", ")} WHERE id IN ${$i(l, 0)}`;
    return { query, args };
  } 

  public async execute(
    query: string,
    args: SqlValue[],
    client: PGClient | null): Promise<PGResponse> {
    
    return exe( query, args, client );
    
  }
};
