import { isObject } from "@dwtechs/checkard";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { SqlValue, Row } from "../types";
import { log } from "@dwtechs/winstan";
import { LOGS_PREFIX } from "../constants";

export class Archive {

  /**
   * Generates a simplified SQL UPDATE query string that sets `archived = true` for the given rows.
   *
   * @param {string} schema - The name of the schema.
   * @param {string} table - The name of the table where the rows will be archived.
   * @param {(Row | SqlValue)[]} rows - An array of ids, or of row objects each containing an `id` property.
   * @param {string | number} [updaterId] - Optional. The ID of the updater.
   * @param {string} [updaterName] - Optional. The name of the user.
   * @returns {{ query: string, args: SqlValue[] }} An object containing the generated SQL query string and an array of arguments.
   * @example
   * const { query, args } = archive.query("public", "Users", [{ id: 1 }, { id: 2 }], 42, "admin");
   * // query: UPDATE public."Users" SET archived = true, "updaterId" = $3, "updaterName" = $4 WHERE id IN ($1, $2)
   * // args: [1, 2, 42, "admin"]
   * @example
   * const { query, args } = archive.query("public", "Users", [1, 2], 42, "admin");
   * // same result as above, ids passed directly
   */
  public query(
    schema: string,
    table: string,
    rows: (Row | SqlValue)[],
    updaterId?: string | number,
    updaterName?: string
  ): { query: string, args: SqlValue[] } {

    log.debug(() => `${LOGS_PREFIX}Archive query input rows: ${JSON.stringify(rows, null, 2)}`);

    const l = rows.length;
    const args: SqlValue[] = rows.map(row => isObject(row) ? (row as Row).id : row as SqlValue);
    let query = `UPDATE ${quoteIfUppercase(schema)}.${quoteIfUppercase(table)} SET archived = true`;

    if (updaterId !== undefined && updaterName !== undefined) {
      query += `, "updaterId" = $${l + 1}, "updaterName" = $${l + 2}`;
      args.push(updaterId, updaterName);
    }

    query += ` WHERE id IN ${$i(l, 0)}`;
    return { query, args };
  }

}
