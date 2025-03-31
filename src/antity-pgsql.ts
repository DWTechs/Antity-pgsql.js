import { isString } from '@dwtechs/checkard';
import { log } from "@dwtechs/winstan";
import { Entity, Property } from "@dwtechs/antity";
import { chunk, deleteProps } from "@dwtechs/sparray";
import * as map from "./map";

import { select } from "./crud/crud";
import { build } from "./crud/query";
import type { Filters, PGResponse, Operation } from "./types";
import type { Request, Response, NextFunction } from 'express';

export interface AntityGetBody extends Request {
  body: {
    first?: number;
    rows?: number;
    sortOrder?: string;
    sortField?: string;
    filters?: Filters;
    pagination?: boolean;
  }
}

// Builds the where clause with given filters
// Filters should be as follow :
// filters={
//   "key1":{"value":"xxx", "matchMode":"contains"}, => string
//   "key2":{"value":[1,2], "matchMode":"contains"}, => number[]
//   "key3":{"value":true, "matchMode":"contains"},  => boolean
//   "key4":{"value":["2023-04-09T22:00:00.000Z","2023-04-12T21:59:59.000Z"],"matchMode":"between"}, => date range
//   "key5":{"value":false} => boolean,
//   "key6":{"value":1400, "subProp":"xxx"} => JsonAgg[]
//   "key7":{"value":{"2":[1,2], "3":[3]} => object[]
// };
// MatchMode is optional.
// key is the name of a column in database
// aggregate columns must have an "Agg" suffix
// Other cases may be added


export class SQLEntity extends Entity {
  private _table: string;
  private _cols = {
    SELECT: [],
    INSERT: [],
    UPDATE: [],
    MERGE: [],
    DELETE: []
  };

  constructor(
    name: string, 
    properties: Property[], 
    table: string, 
  ) {
    super(name, properties); // Call the constructor of the base class
    this._table = table;
    // _cols help to dynamically generates SQL queries.
    // data is grouped by operation type, making it easy to retrieve and process later.
    for (const p of properties) {
      for (const m of p.methods) {
        const o = map.method(m);
        if (o) {
          const c = this._cols[o];
          if (o === "UPDATE") // The "update" operation requires special formatting (key = $index), while other operations only store the key.
            c.push(`${p.key} = $${c.length+1}`); 
          else
            c.push(p.key);
        }
      }
    }
  }

  public get table(): string {
    return this._table;
  }

  public get cols(): Record<Operation, string[]> {
    return this._cols;
  }

  public set table(table: string) {
    if (!isString(table, "!0"))
      throw new Error('table must be a string of length > 0');
    this._table = table;
  }


    /**
   * Retrieves the columns associated with a specific database operation, with optional
   * stringification and pagination handling.
   *
   * @param {Operation} operation - The database operation (e.g., "select", "insert", etc.)
   *                                for which to retrieve the columns.
   * @param {boolean} [stringify] - Optional. If `true`, the columns will be returned as a 
   *                                comma-separated string. Defaults to `false`.
   * @param {boolean} [pagination] - Optional. If `true` and the operation is "select", 
   *                                 adds a "COUNT(*) OVER () AS total" column for pagination.
   *                                 Defaults to `false`.
   * @returns {string[] | string} - The columns for the specified operation. Returns an array
   *                                of column names by default, or a comma-separated string
   *                                if `stringify` is `true`.
   */
  public getColsByOp(
    operation: Operation, 
    stringify?: boolean, 
    pagination?: boolean, 
  ): string[] | string {
    const cols = pagination && operation === "SELECT" 
      ? [...this._cols[operation], "COUNT(*) OVER () AS total"] 
      : this.cols[operation];
    return stringify ? cols.join(', ') : cols;
  }

  public get( req: Request, res: Response, next: NextFunction ): void {

    const rb = req.body;
    const first = rb?.first ?? 0;
    const rows = rb.rows ? rb.rows : null;
    const sortOrder = rb.sortOrder;
    const sortField = rb.sortField || null;
    const filters = rb.filters || null;
    const pagination = rb.pagination || false;

    log.debug(
      `get(first='${first}', rows='${rows}', 
      sortOrder='${sortOrder}', sortField='${sortField}', 
      pagination=${pagination}, filters=${JSON.stringify(filters)}`,
    );

    const cols = this.getColsByOp("SELECT", true, pagination);
    const table = this.getTable();
    const { query, args } = build("SELECT", cols as string, table, first, rows, sortOrder, sortField, filters);
    select(query, args)
      .then((r: PGResponse) => {
        res.locals.rows = r.rows;
        res.locals.total = r.total;
        next();
      })
      .catch((err: Error) => next(err));

  }


  public add( req: Request, res: Response, next: NextFunction ): void {
    const chunks = chunk(req.body.rows);
    const dbClient = req.dbClient || null;
  
    log.debug(`addMany(rows=${req.body.rows.length})`);
    for (const c of chunks) {
      let query = "";
      const args = [];
      for (const r of c) {
        query += `${this.generateQueryPlaceholders(r.length + 2)}, `;
        args.push(...r, consumerId, consumerName);
      }
      query = `${query.slice(0, -2)}`;
      let db;
      try {
        db = await svc.insert(req.table, req.cols, query, args, "id", dbClient);
      } catch (err) {
        return next(err);
      }
    }
  
    // add new id to new rows
    const rows = db.rows;
    for (i = 0; i < c.length; i++) {
      c[i] = rows[i].id;
    }
    next();
  }

  public update( req: Request, res: Response, next: NextFunction ): void {

  }

  public delete( req: Request, res: Response, next: NextFunction ): void {

  }


}



// /**
//  * Updates a table with the given queries and arguments.
//  *
//  * @param {string} table - The name of the table to update.
//  * @param {Array<string>} queries - An array of update queries to execute.
//  * @param {Array} args - The arguments for the update queries.
//  * @param {Object} client - The PostgreSQL client object (optional).
//  * @return {Promise} A promise that resolves with the result of the update queries.
//  */
// function update(table: string, queries: string[], args: string[], client: any): Promise<any> {
//   let query = "";
//   for (const q of queries) {
//     query += `UPDATE "${table}" SET ${q};`;
//   }
//   return execute(query, args, client);
// }

// /**
//  * Deletes rows from a table based on the provided IDs.
//  *
//  * @param {string} table - The name of the table from which to delete rows.
//  * @param {Array} args - An array of IDs used to identify rows to delete.
//  * @param {Object} client - The PostgreSQL client object (optional).
//  * @return {Promise} A promise that resolves with the result of the delete operation.
//  */
// function deleteIds(table: string, args: string[], client: any): Promise<any> {
//   const query = `DELETE FROM "${table}" WHERE id IN ${generateQueryPlaceholders(
//     args.length,
//   )}`;
//   return execute(query, args, client);
// }

// /**
//  * Deletes item from the specified table based on the provided id.
//  *
//  * @param {string} table - The name of the table from which to delete rows.
//  * @param {integer} id - The id used to identify rows to delete.
//  * @param {Object} client - The PostgreSQL client object (optional).
//  * @return {Promise} A promise that resolves with the result of the delete operation.
//  */
// function deleteOne(table: string, id: number, client: any) {
//   const query = `DELETE FROM "${table}" WHERE id = $1`;
//   return execute(query, [id], client);
// }

// /**
//  * Deletes old items from the specified table based on the provided date.
//  *
//  * @param {string} table - The name of the table from which to delete rows.
//  * @param {Date} date - The date used to identify old items to delete.
//  * @param {Object} client - The PostgreSQL client object (optional).
//  * @return {Promise} A promise that resolves with the result of the delete operation.
//  */
// function deleteOld(table: string, date: number, client: any) {
//   const query = `DELETE FROM "${table}" WHERE "archivedAt" < $1`;
//   return execute(query, [date], client);
// }

// /**
//  * Generates a PostgreSQL query string with placeholders for a given quantity of values.
//  *
//  * @param {number} qty - The quantity of values to generate placeholders for.
//  * @return {string} The generated query string with placeholders.
//  */
// function generateQueryPlaceholders(qty: number): string {
//   return `(${Array.from({ length: qty }, (_, i) => `$${i + 1}`).join(", ")})`;
// }
