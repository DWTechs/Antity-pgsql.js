import { execute as exe } from "./execute";
import { quoteIfUppercase } from "./quote";
import type { PGResponse } from "../types";

/**
 * Generates a DELETE query for rows by their IDs.
 * 
 * @param {string} schema - The name of the schema.
 * @param {string} table - The name of the table to delete from.
 * @param {number[]} ids - Array of IDs to delete.
 * @returns {{ query: string, args: number[] }} Object containing the SQL query and arguments.
 * 
 * @example
 * const result = queryById('public', 'users', [1, 2, 3]);
 * // Returns: { query: 'DELETE FROM public.users WHERE id = ANY($1)', args: [1, 2, 3] }
 */
function queryById(schema: string, table: string, ids: number[]): { query: string, args: any[] } {
  return {
    query: `DELETE FROM ${quoteIfUppercase(schema)}.${quoteIfUppercase(table)} WHERE id = ANY($1)`,
    args: [ids]
  };
}

/**
 * Generates a query to call the hard_delete function for archived rows before a specific date.
 * 
 * @param {string} schema - The name of the schema.
 * @param {string} table - The name of the table to delete from.
 * @returns {string} SQL query string.
 * 
 * @example
 * const query = queryArchived('public', 'users');
 * // Returns: 'SELECT hard_delete($1, $2, $3)'
 */
function queryByDate(): string {
  // SELECT hard_delete('public', 'route', NOW() - INTERVAL '1 year')
  return `SELECT hard_delete($1, $2, $3)`;
}

/**
 * Executes the hard_delete function for archived rows.
 * 
 * @param {string} schema - The name of the schema.
 * @param {string} table - The name of the table.
 * @param {Date} date - The date threshold for deletion. Rows archived before this date will be deleted.
 * @param {string} query - The SQL query to execute.
 * @param {any} client - The database client.
 * @returns {Promise<PGResponse>} Promise that resolves with the database response.
 * @throws {Error} If the database operation fails.
 * 
 * @example
 * const query = queryArchived('public', 'users');
 * await executeArchived('public', 'users', new Date('2025-01-01'), query, dbClient);
 */
async function executeArchived(
  schema: string,
  table: string,
  date: Date,
  query: string,
  client: any): Promise<PGResponse> {
  
  let db: PGResponse;
  try {
    db = await exe(query, [schema, table, date], client);
  } catch (err: unknown) {
    throw err;
  }
  return db; 
}

export {
  queryById,
  queryByDate,
  executeArchived,
};
