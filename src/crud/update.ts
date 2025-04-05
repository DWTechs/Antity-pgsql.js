import { chunk, flatten } from "@dwtechs/sparray";
import { execute } from "./execute";
import type { PGResponse, LogicalOperator } from "../types";

async function update(
  rows: Record<string, any>[],
  table: string,
  cols: string,
  consumerId: string,
  consumerName: string,
  client: any): Promise<void> {
  
  // Add consumerId and consumerName to each row
  rows = rows.map(row => ({
    ...row,
    consumerId,
    consumerName,
  }));

  const chunks = chunk(rows);
  let q = `UPDATE "${table}" `;
  let i = 0;
  for (const c of chunks) {
    let v = "SET ";
    const args: (string | number | boolean | Date | number[])[] = [];
    for (const p of cols) {
      v += `${p} = CASE `;
      for (const row of c) {
        v += `WHEN id = ${i++} THEN $${i++} `;
        args.push(row.id, row[p]);
      }
      v += `END, `;
    }
    q += `${v.slice(0, -2)} WHERE id IN ${extractIds(c)}`;
    let db: PGResponse;
    try {
      db = await execute(q, args, client);
    } catch (err: unknown) {
      throw err;
    }
  }
  
}

function extractIds(chunk: Record<string, any>[]): string {
  const ids = chunk.map(row => row.id); // Extract the 'id' field from each row
  return `(${ids.join(",")})`; // Join the IDs with commas and wrap them in parentheses
}

export {
  update,
};
