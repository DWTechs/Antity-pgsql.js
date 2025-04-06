import { chunk, flatten } from "@dwtechs/sparray";
import { execute } from "./execute";
import type { PGResponse } from "../types";

async function insert(
  rows: Record<string, any>[],
  table: string,
  cols: string,
  rtn: string,
  consumerId: string,
  consumerName: string,
  client: any): Promise<Record<string, any>[]> {
  
  const chunks = chunk(rows);
  const q = `INSERT INTO "${table}" (${cols}) VALUES `;
  const rq = rtn ? ` RETURNING ${rtn}` : "";

  for (const c of chunks) {
    let values = "";
    const args = [];
    for (const row of c) {
      values += `${$i(row.length + 2)}, `;
      args.push(...row, consumerId, consumerName);
    }
    values = `${values.slice(0, -2)}`;
    let db: PGResponse;
    const query = `${q}${values}${rq}`;
    try {
      db = await execute(query, args, client);
    } catch (err: unknown) {
      throw err;
    }
    // add new id to new rows
    const r = db.rows;
    for (let i = 0; i < c.length; i++) {
      c[i] = r[i].id;
    }
  }
  return flatten(chunks);

}


  /**
  * Generates a PostgreSQL query string with placeholders for a given quantity of values.
  *
  * @param {number} qty - The quantity of values to generate placeholders for.
  * @return {string} The generated query string with placeholders.
  */
  function $i(qty: number): string {
    return `(${Array.from({ length: qty }, (_, i) => `$${i + 1}`).join(", ")})`;
  }

export {
  insert,
};
