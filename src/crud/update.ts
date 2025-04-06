import { chunk } from "@dwtechs/sparray";
import { execute } from "./execute";
// import type { PGResponse } from "../types";

async function update(
  rows: Record<string, unknown>[],
  table: string,
  cols: string[],
  consumerId: string,
  consumerName: string,
  client: any): Promise<void> {
  
  rows = addConsumer(rows, consumerId, consumerName);

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
    // let db: PGResponse;
    try {
      await execute(q, args, client);
    } catch (err: unknown) {
      throw err;
    }
  }
  
}

// Add consumerId and consumerName to each row
function addConsumer(
  rows: Record<string, unknown>[],
  consumerId: string,
  consumerName: string
): Record<string, unknown>[] {
  return rows.map((row: Record<string, unknown>) => ({
    ...row,
    consumerId,
    consumerName,
  }));
}

function extractIds(chunk: Record<string, any>[]): string {
  const ids = chunk.map(row => row.id); // Extract the 'id' field from each row
  return `(${ids.join(",")})`; // Join the IDs with commas and wrap them in parentheses
}

export {
  update,
};
