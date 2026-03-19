import { execute as exe } from "./execute";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { PGResponse, Filter } from "../types";
import { log } from "@dwtechs/winstan";
import { LOGS_PREFIX } from "../constants";

export class Archive {

  /**
   * Generates a simplified SQL UPDATE query string that sets `archived = true` for the given rows.
   *
   * @param {string} schema - The name of the schema.
   * @param {string} table - The name of the table where the rows will be archived.
   * @param {Record<string, any>[]} rows - An array of objects representing the rows to archive. Each object must contain an `id` property.
   * @param {string | number} [consumerId] - Optional. The ID of the consumer (for history tracking).
   * @param {string} [consumerName] - Optional. The name of the consumer (for history tracking).
   * @returns {{ query: string, args: (Filter["value"])[] }} An object containing the generated SQL query string and an array of arguments.
   * @example
   * const { query, args } = archive.query("public", "Users", [{ id: 1 }, { id: 2 }], 42, "admin");
   * // query: UPDATE public."Users" SET archived = true, "consumerId" = $3, "consumerName" = $4 WHERE id IN ($1, $2)
   * // args: [1, 2, 42, "admin"]
   */
  public query(
    schema: string,
    table: string,
    rows: Record<string, any>[],
    consumerId?: string | number,
    consumerName?: string
  ): { query: string, args: (Filter["value"])[] } {

    log.debug(`${LOGS_PREFIX}Archive query input rows: ${JSON.stringify(rows, null, 2)}`);

    const l = rows.length;
    const args: (Filter["value"])[] = rows.map(row => row.id);
    let query = `UPDATE ${quoteIfUppercase(schema)}.${quoteIfUppercase(table)} SET archived = true`;

    if (consumerId !== undefined && consumerName !== undefined) {
      query += `, ${quoteIfUppercase("consumerId")} = $${l + 1}, ${quoteIfUppercase("consumerName")} = $${l + 2}`;
      args.push(consumerId, consumerName);
    }

    query += ` WHERE id IN ${$i(l, 0)}`;
    return { query, args };
  }

  /**
   * Executes the archive query against the database.
   *
   * @param {string} query - The SQL query string to execute.
   * @param {(Filter["value"])[]} args - The arguments for the query.
   * @param {any} client - The PostgreSQL client instance.
   * @returns {Promise<PGResponse>} The result of the query execution.
   * @example
   * const result = await archive.execute(query, args, client);
   */
  public async execute(
    query: string,
    args: (Filter["value"])[],
    client: any
  ): Promise<PGResponse> {

    return exe(query, args, client);

  }

}
