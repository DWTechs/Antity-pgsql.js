import { execute } from "./execute";
import type { PGResponse } from "../types";

async function del(
  date: Date,
  table: string,
  // consumerId: string,
  // consumerName: string,
  client: any): Promise<PGResponse> {
  
  const query = `DELETE FROM "${table}" WHERE "archivedAt" < $1`;
  let db: PGResponse;
  try {
    db = await execute(query, [date], client);
  } catch (err: unknown) {
    throw err;
  }
  return db;
  
}

export {
  del,
};
