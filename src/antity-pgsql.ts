import { log } from "@dwtechs/winstan";
import { Entity } from "@dwtechs/antity";
import { chunk, deleteProps } from "@dwtechs/sparray";

import { filter } from "./crud/select";
import { execute } from "./execute";
import type { Filter, Filters, PGResponse } from "./types";
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
  
  // constructor(table: string, properties: Property[]) {
  //   super(table, properties); // Call the constructor of the base class
  // }

  public get( req: Request, res: Response, next: NextFunction ): void {

    const rb = req.body;
    const first = rb?.first ?? 0;
    const rows = rb.rows ? Math.min(rb.rows, 50) : null;
    const sortOrder = rb.sortOrder === -1 ? "DESC" : "ASC";
    const sortField = rb.sortField || null;
    const filters = req.filters || null;
    const pagination = rb.pagination || false;

    log.debug(
      `get(first='${first}', rows='${rows}', 
      sortOrder='${sortOrder}', sortField='${sortField}', 
      pagination=${pagination}, filters=${JSON.stringify(filters)}`,
    );

    const { filterClause, args } = filter(first, rows, sortOrder, sortField, filters);
    const cols = this.getCols("select", true, pagination);
    const table = this.getTable();
    const query = `SELECT ${cols} FROM ${table} ${filterClause}`;
    execute(query, args, null)
      .then((r: PGResponse) => {
        if (!r.rowCount) 
          return next({ status: 404, msg: "Resource not found" });
  
        const firstRow = r.rows[0];
        res.rows = r.rows;
        if (firstRow.total) {
          res.total = firstRow.total; // total number of rows without first and rows limits. Useful for pagination. Do not confuse with rowcount
          res.rows = deleteProps(res.rows, ["total"]);
        }
        next();
      })
      .catch((err) => next(err));

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

  /**
   * Generates a PostgreSQL query string with placeholders for a given quantity of values.
   *
   * @param {number} qty - The quantity of values to generate placeholders for.
   * @return {string} The generated query string with placeholders.
   */
  private generateQueryPlaceholders(qty) {
    return `(${Array.from({ length: qty }, (_, i) => `$${i + 1}`).join(", ")})`;
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
