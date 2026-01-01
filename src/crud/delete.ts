import { execute as exe } from "./execute";
import { quoteIfUppercase } from "./quote";
import type { PGResponse } from "../types";

/**
 * Generates a DELETE query for rows by their IDs.
 * 
 * @param {string} table - The name of the table to delete from.
 * @param {number[]} ids - Array of IDs to delete.
 * @returns {{ query: string, args: number[] }} Object containing the SQL query and arguments.
 * 
 * @example
 * const result = queryById('users', [1, 2, 3]);
 * // Returns: { query: 'DELETE FROM users WHERE id = ANY($1)', args: [1, 2, 3] }
 */
function queryById(table: string, ids: number[]): { query: string, args: any[] } {
  return {
    query: `DELETE FROM ${quoteIfUppercase(table)} WHERE id = ANY($1)`,
    args: [ids]
  };
}

/**
 * Generates a DELETE query for archived rows before a specific date.
 * 
 * @param {string} table - The name of the table to delete from.
 * @returns {string} SQL query string.
 * 
 * @example
 * const query = queryArchived('users');
 * // Returns: 'DELETE FROM users WHERE "archivedAt" < $1'
 */
function queryArchived(table: string): string {
  return `DELETE FROM ${quoteIfUppercase(table)} WHERE "archivedAt" < $1`;
}

/**
 * Executes a DELETE query for archived rows.
 * 
 * @param {Date} date - The date threshold for deletion. Rows archived before this date will be deleted.
 * @param {string} query - The SQL query to execute.
 * @param {any} client - The database client.
 * @returns {Promise<PGResponse>} Promise that resolves with the database response.
 * @throws {Error} If the database operation fails.
 * 
 * @example
 * const query = queryArchived('users');
 * await executeArchived(new Date('2025-01-01'), query, dbClient);
 */
async function executeArchived(
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
  queryById,
  queryArchived,
  executeArchived,
};
