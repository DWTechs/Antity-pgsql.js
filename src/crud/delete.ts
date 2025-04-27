import { execute as exe } from "./execute";
import { quoteIfUppercase } from "./quote";
import type { PGResponse } from "../types";

function query(table: string): string {
  return `DELETE FROM ${quoteIfUppercase(table)} WHERE "archivedAt" < $1`;
}

async function execute(
  date: Date,
  query: string,
  client: any): Promise<PGResponse> {
  
  let db: PGResponse;
  try {
    db = await exe(query, [date], client);
  } catch (err: unknown) {
    throw err;
  }
  return db; 
}

export {
  query,
  execute,
};
