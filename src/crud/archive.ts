import { execute as exe } from "./execute";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { PGResponse, SqlValue, Row, PGClient } from "../types";
import { log } from "@dwtechs/winstan";
import { LOGS_PREFIX } from "../constants";

export class Archive {

  /**
   * Generates a simplified SQL UPDATE query string that sets `archived = true` for the given rows.
   *
   * @param {string} schema - The name of the schema.
   * @param {string} table - The name of the table where the rows will be archived.
   * @param {Record<string, any>[]} rows - An array of objects representing the rows to archive. Each object must contain an `id` property.
   * @param {string | number} [updaterId] - Optional. The ID of the updater.
   * @param {string} [updaterName] - Optional. The name of the user.
   * @returns {{ query: string, args: SqlValue[] }} An object containing the generated SQL query string and an array of arguments.
   * @example
   * const { query, args } = archive.query("public", "Users", [{ id: 1 }, { id: 2 }], 42, "admin");
   * // query: UPDATE public."Users" SET archived = true, "updaterId" = $3, "updaterName" = $4 WHERE id IN ($1, $2)
   * // args: [1, 2, 42, "admin"]
   */
  public query(
    schema: string,
    table: string,
    rows: Row[],
    updaterId?: string | number,
    updaterName?: string
  ): { query: string, args: SqlValue[] } {

    log.debug(() => `${LOGS_PREFIX}Archive query input rows: ${JSON.stringify(rows, null, 2)}`);

    const l = rows.length;
    const args: SqlValue[] = rows.map(row => row.id);
    let query = `UPDATE ${quoteIfUppercase(schema)}.${quoteIfUppercase(table)} SET archived = true`;

    if (updaterId !== undefined && updaterName !== undefined) {
      query += `, "updaterId" = $${l + 1}, "updaterName" = $${l + 2}`;
      args.push(updaterId, updaterName);
    }

    query += ` WHERE id IN ${$i(l, 0)}`;
    return { query, args };
  }

  /**
   * Executes the archive query against the database.
   *
   * @param {SqlValue[]} args - The arguments for the query.
   * @param {any} client - The PostgreSQL client instance.
   * @returns {Promise<PGResponse>} The result of the query execution.
   * @example
   * const result = await archive.execute(query, args, client);
   */
  public async execute(
    query: string,
    args: SqlValue[],
    client: PGClient | null
  ): Promise<PGResponse> {

    return exe(query, args, client);

  }

}
