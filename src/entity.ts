import { isString } from '@dwtechs/checkard';
import { arrayChunk, arrayFlatten } from "@dwtechs/sparray";
import { log } from "@dwtechs/winstan";
import { Entity, Property, Method } from "@dwtechs/antity";
import * as map from "./map";
import * as check from "./check";
import { Select } from "./crud/select";
import { Insert } from "./crud/insert";
import { Update } from "./crud/update";
import * as del from "./crud/delete";
import { filter } from "./filter/filter";
import { execute } from "./crud/execute";
import type { PGResponse, Filters } from "./types";
import type { Request, Response, NextFunction } from 'express';

export class SQLEntity extends Entity {
  private _table: string;
  private sel: Select = new Select();
  private ins: Insert = new Insert();
  private upd: Update = new Update();

  constructor(
    name: string, 
    properties: Property[], 
  ) {
    super(name, properties); // Call the constructor of the base class
    this._table = name;
    // properties is grouped by operation type, making it easy to retrieve and process later.
    for (const p of properties) {
      this.mapProps(p.methods, p.key);
    }
  }

  public get table(): string {
    return this._table;
  }

  public set table(table: string) {
    if (!isString(table, "!0"))
      throw new Error('table must be a string of length > 0');
    this._table = table;
  }

  public query = { 
    select: (paginate: boolean): string => {
      return this.sel.query(this.table, paginate);
    },
    update: (
      rows: Record<string, unknown>[], 
      consumerId: number | string, 
      consumerName: string,
    ): { query: string, args: unknown[] } => {
      return this.upd.query(this.table, rows, consumerId, consumerName);
    },
    insert: (
      rows: Record<string, unknown>[], 
      consumerId: number | string, 
      consumerName: string,
      rtn: string = ""
    ): { query: string, args: unknown[] } => {
      return this.ins.query(this.table, rows, consumerId, consumerName, rtn);
    },
    delete: (): string => {
      return del.query(this.table);
    },
    return: (prop: string): string => {
      return this.ins.rtn(prop);
    }
  }

  public get( req: Request, res: Response, next: NextFunction ): void {
    const l = res.locals;
    const b = req.body;
    const first = b?.first ?? 0;
    const rows = b.rows || null;
    const sortField = b.sortField || null;
    const sortOrder = b.sortOrder === -1 || b.sortOrder === "DESC" ? "DESC" : "ASC";
    const filters = this.cleanFilters(b.filters) || null;
    const pagination = b.pagination || false;
    const dbClient = l.dbClient || null;

    log.debug(
      `get(first='${first}', rows='${rows}', 
      sortOrder='${sortOrder}', sortField='${sortField}', 
      pagination=${pagination}, filters=${JSON.stringify(filters)}`,
    );

    const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);
    const q = this.sel.query(this._table, pagination) + filterClause;
    this.sel.execute( q, args, dbClient)
      .then((r: PGResponse) => {
        l.rows = r.rows;
        l.total = r.total;
        next();
      })
      .catch((err: Error) => next(err));

  }

  public async add( req: Request, res: Response, next: NextFunction ): Promise<void> {
    const l = res.locals;
    const rows = req.body.rows;
    const dbClient = l.dbClient || null;
    const cId = l.consumerId;
    const cName = l.consumerName;
    
    log.debug(`addMany(rows=${rows.length}, consumerId=${cId})`);
     
    const rtn = this.ins.rtn("id");
    const chunks = arrayChunk(rows);
    for (const c of chunks) {
      const { query, args } = this.ins.query(this._table, c, cId, cName, rtn);
      let db: PGResponse;
      try {
        db = await execute(query, args, dbClient);
      } catch (err: unknown) {
        return next(err);
      }
      // add new id to new rows
      const r = db.rows;
      for (let i = 0; i < c.length; i++) {
        c[i].id = r[i].id;
      }
    }
    l.rows = arrayFlatten(chunks);
    next();
  }

  public async update( req: Request, res: Response, next: NextFunction ): Promise<void> {
    const l = res.locals;
    const rows = req.body.rows;
    const dbClient = l.dbClient || null;
    const cId = l.consumerId;
    const cName = l.consumerName;
    
    log.debug(`update(rows=${rows.length}, consumerId=${cId})`);

    const chunks = arrayChunk(rows);
    for (const c of chunks) {
      const { query, args } = this.upd.query(this._table, c, cId, cName);
      try {
        await execute(query, args, dbClient);
      } catch (err: unknown) {
        return next(err);
      }
    }
    next();
  }

  public async archive( req: Request, res: Response, next: NextFunction ): Promise<void> { // Changed to Promise<void>
    const l = res.locals;
    let rows = req.body.rows; // list of ids [{id: 1}, {id: 2}]
    const dbClient = l.dbClient || null;
    const cId = l.consumerId;
    const cName = l.consumerName;
    
    log.debug(`archive(rows=${rows.length}, consumerId=${cId})`);

    // Add archived value
    rows = rows.map((id: Record<string, unknown>) => ({
      ...id,
      archived: true,
    }));

    const chunks = arrayChunk(rows);
    for (const c of chunks) {
      const { query, args } = this.upd.query(this._table, c, cId, cName);
      try {
        await execute(query, args, dbClient);
      } catch (err: unknown) {
        return next(err);
      }
    }
    next();

  }

  public delete( req: Request, res: Response, next: NextFunction ): void {
    const date = req.body.date;
    const dbClient = res.locals.dbClient || null;
    
    log.debug(`delete archived`);
    const q = del.query(this._table);
    del.execute( date, q, dbClient)
      .then(() => next())
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

  private mapProps(methods: Method[], key: string): void {
    for (const m of methods) {
      switch (m) {
        case "GET":
          this.sel.addProp(key);
          break;
        case "PATCH":
          this.upd.addProp(key);
          break;
        case "PUT":
          this.upd.addProp(key);
          break;
        case "POST":
          this.ins.addProp(key);
          break;
        default:
          break;
      }
    }
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
