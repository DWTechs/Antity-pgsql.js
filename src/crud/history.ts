import { execute } from "./execute";
import type { SqlValue, PGClient, PGResponse, HistoryEntry } from "../types";

// Bookkeeping columns every audited table stamps on every write, regardless
// of which field actually changed - always ignored, or a history row would
// never look like a no-op even when only system-managed columns changed.
const ALWAYS_IGNORED_COLS = ["updatedAt", "updaterId", "updaterName"];

// Arrays/objects parsed from JSON are never === even when equal.
const same = (a: unknown, b: unknown): boolean =>
  a === b || JSON.stringify(a) === JSON.stringify(b);

/**
 * Groups history rows that belong to the same logical action (e.g. a route
 * update that also rewrites its route_operation/route_method junction rows)
 * into a single entry.
 *
 * Rows are grouped by (tstamp, userId, record.id): Postgres `now()` is
 * transaction-stable so every row written by the same transaction shares the
 * same tstamp, and record.id (the audited entity's own id, reused by
 * junction-table history rows) keeps unrelated records apart when several
 * of them are updated in a single bulk transaction. A merged group keeps the
 * first row's id/operation/tstamp/userName and combines all `record`
 * fields into one object.
 *
 * @param rows - rows returned by `query()`, ordered by tstamp ASC, id ASC
 * @returns grouped history entries
 */
function groupByAction(rows: HistoryEntry[]): HistoryEntry[] {
  const groups = new Map<string, HistoryEntry>();
  for (const row of rows) {
    const tstamp = row.tstamp instanceof Date ? row.tstamp.toISOString() : row.tstamp;
    const key = `${tstamp}_${row.userId}_${row.record?.id}`;
    const group = groups.get(key);
    if (!group)
      groups.set(key, {
        id: row.id,
        tstamp: row.tstamp,
        operation: row.operation,
        userId: row.userId,
        userName: row.userName,
        record: { ...row.record },
      });
    else Object.assign(group.record, row.record);
  }
  return [...groups.values()];
}

/**
 * Drops history entries that changed nothing but ignored columns, so a
 * revision view only shows entries a human could actually revert to.
 * `log.history` itself is untouched - this only filters what gets returned.
 *
 * Always keeps the first entry (the `INSERT` baseline). Each later entry is
 * compared against the last *kept* entry's record, ignoring `ignoreCols` plus
 * the bookkeeping columns every write stamps; it is kept only if some other
 * key differs, so runs of pure-noise entries collapse into whichever real
 * edit preceded them.
 *
 * @param rows - grouped history entries, ordered oldest to newest
 * @param ignoreCols - field-specific columns to ignore (e.g. system-managed fields)
 * @returns entries with no-op ones dropped
 */
function filterMeaningful(rows: HistoryEntry[], ignoreCols: string[] = []): HistoryEntry[] {
  const ignored = new Set([...ignoreCols, ...ALWAYS_IGNORED_COLS]);
  const kept: HistoryEntry[] = [];
  let prevRecord: Record<string, unknown> | null = null;
  for (const row of rows) {
    if (!prevRecord) {
      kept.push(row);
      prevRecord = row.record;
      continue;
    }
    const prev: Record<string, unknown> = prevRecord;
    const changed = Object.keys(row.record).some(
      (key) => !ignored.has(key) && !same(row.record[key], prev[key]),
    );
    if (changed) {
      kept.push(row);
      prevRecord = row.record;
    }
  }
  return kept;
}

/**
 * Reads the raw history rows of one record from `log.history`.
 * `field` and `tables` are bound as parameters, never interpolated into the SQL.
 * The author of each write is `userId`/`userName`, as stored in `log.history`.
 *
 * @param schema - schema of the audited tables
 * @param tables - audited table(s) to read (a record and its junction tables)
 * @param field - key of `record` holding the id to match
 * @param value - the id to look for
 * @param client - database client, or null for the shared pool
 */
function query(
  schema: string,
  tables: string[],
  field: string,
  value: string | number,
  client: PGClient | null,
): Promise<PGResponse> {
  const sql = `
    SELECT id, tstamp, operation, "userId", "userName", record
    FROM log.history
    WHERE "schemaName" = $1
      AND "tableName" = ANY($2::text[])
      AND CAST(record->>$3::text AS INT) = $4
    ORDER BY tstamp ASC, id ASC
  `;
  return execute(sql, [schema, tables, field, value] as unknown as SqlValue[], client);
}

export { groupByAction, filterMeaningful, query };
