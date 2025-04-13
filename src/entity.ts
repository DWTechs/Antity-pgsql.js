import { isString } from '@dwtechs/checkard';
import { log } from "@dwtechs/winstan";
import { Entity, Property } from "@dwtechs/antity";
import * as map from "./map";
import * as check from "./check";
import { select } from "./crud/select";
import { insert } from "./crud/insert";
import { update } from "./crud/update";
import { del } from "./crud/delete";
import type { PGResponse, Operation, Filters } from "./types";
import type { Request, Response, NextFunction } from 'express';

export class SQLEntity extends Entity {
  private _table: string;
  private _cols: Record<Operation, string[]> = {
    SELECT: [],
    INSERT: [],
    UPDATE: [],
    // MERGE: [],
    DELETE: []
  };

  constructor(
    name: string, 
    properties: Property[], 
    table: string, 
  ) {
    super(name, properties); // Call the constructor of the base class
    this._table = table;
    // _cols help to dynamically generate SQL queries.
    // data is grouped by operation type, making it easy to retrieve and process later.
    for (const p of properties) {
      for (const m of p.methods) {
        const o = map.method(m);
        if (o)
          this._cols[o].push(p.key);
      }
    }
    this._cols.INSERT.push("consumerId", "consumerName");
    this._cols.UPDATE.push("consumerId", "consumerName");
    this._cols.DELETE.push("consumerId", "consumerName");
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
    stringify: boolean = false, 
    pagination: boolean = false, 
  ): string[] | string {
    const cols = pagination && operation === "SELECT" 
      ? [...this._cols[operation], "COUNT(*) OVER () AS total"] // Add total column for pagination
      : this.cols[operation];
    return stringify ? cols.join(', ') : cols;
  }

  public get( req: Request, res: Response, next: NextFunction ): void {
    
    const rb = req.body;
    const first = rb?.first ?? 0;
    const rows = rb.rows || null;
    const sortField = rb.sortField || null;
    const sortOrder = rb.sortOrder === -1 || rb.sortOrder === "DESC" ? "DESC" : "ASC";
    const filters = this.cleanFilters(rb.filters) || null;
    const pagination = rb.pagination || false;
    const operation = "SELECT";

    log.debug(
      `get(first='${first}', rows='${rows}', 
      sortOrder='${sortOrder}', sortField='${sortField}', 
      pagination=${pagination}, filters=${JSON.stringify(filters)}`,
    );

    const cols = this.getColsByOp(operation, true, pagination);
    select( 
      cols as string,
      this._table,
      first,
      rows,
      sortField,
      sortOrder,
      filters
    ).then((r: PGResponse) => {
        res.locals.rows = r.rows;
        res.locals.total = r.total;
        next();
      })
      .catch((err: Error) => next(err));

  }

  public add( req: Request, res: Response, next: NextFunction ): void {
    const rows = req.body.rows;
    const dbClient = res.locals.dbClient || null;
    const consumerId = res.locals.consumerId;
    const consumerName = res.locals.consumerName;
    const operation = "INSERT";
    
    log.debug(`addMany(rows=${req.body.rows.length}, consumerId=${consumerId})`);
     
    const cols = this.getColsByOp(operation, true, false);
    insert( 
      rows,
      this._table,
      cols as string,
      "id",
      consumerId,
      consumerName,
      dbClient
    ).then((r: Record<string, any>[]) => {
        res.locals.rows = r;
        next();
      })
      .catch((err: Error) => next(err));
  }

  public update( req: Request, res: Response, next: NextFunction ): void {
    const rows = req.body.rows;
    const dbClient = res.locals.dbClient || null;
    const consumerId = res.locals.consumerId;
    const consumerName = res.locals.consumerName;
    const operation = "UPDATE";
    
    log.debug(`update ${rows.length} rows`);

    const cols = this.getColsByOp(operation, false, false);
    update( 
      rows,
      this._table,
      cols as string[],
      consumerId,
      consumerName,
      dbClient
    ).then(() => next())
     .catch((err: Error) => next(err));

  }

  public archive( req: Request, res: Response, next: NextFunction ): void {
    let rows = req.body.rows; // list of ids [{id: 1}, {id: 2}]
    const dbClient = res.locals.dbClient || null;
    const consumerId = res.locals.consumerId;
    const consumerName = res.locals.consumerName;
    // const operation = "UPDATE";
    
    log.debug(`archive ${rows.length} rows`);

    // Add consumerId and consumerName to each row
    rows = rows.map((row: Record<string, unknown>) => ({
      ...row,
      archived: true,
    }));

    const cols = ["archived", "consumerId", "consumerName"];
    update( 
      rows,
      this._table,
      cols as string[],
      consumerId,
      consumerName,
      dbClient
    ).then(() => next())
     .catch((err: Error) => next(err));

  }

  public delete( req: Request, res: Response, next: NextFunction ): void {
    const date = req.body.date;
    const dbClient = res.locals.dbClient || null;
    
    log.debug(`delete archived`);

    del( 
      date,
      this._table,
      // consumerId,
      // consumerName,
      dbClient
    ).then(() => next())
     .catch((err: Error) => next(err));
  }

  private cleanFilters(filters: Filters): Filters {
    for (const k in filters) {
      if (filters.hasOwnProperty(k)) {
        const prop = this.getProp(k);
        if (!prop) {
          log.warn(`Filters: skipping unknown property: ${k}`);
          delete filters[k];
          continue;
        }

        const type = map.type(prop.type); // transform from entity type to valid sql filter type
        const { /*subProps, */matchMode } = filters[k];

        if (!matchMode || !check.matchMode(type, matchMode)) { // check if match mode is compatible with sql type
          log.warn(`Filters: skipping invalid match mode: "${matchMode}" for type: "${type}" at property: "${k}"`);
          delete filters[k];
          continue;
        }
      }
    }
    return filters;
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
