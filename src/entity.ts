import { isString } from '@dwtechs/checkard';
import { chunk, flatten } from "@dwtechs/sparray";
import { log } from "@dwtechs/winstan";
import { Entity } from "@dwtechs/antity";
import { Property } from './property';
import { Select } from "./crud/select";
import { Insert } from "./crud/insert";
import { Update } from "./crud/update";
import * as del from "./crud/delete";
import { cleanFilters } from "./filter/clean";
import { execute } from "./crud/execute";
import { logSummary } from "./logger";
import { LOGS_PREFIX } from './constants';  
import type { PGResponse, Filters, Filter, Operation } from "./types";
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
    
    log.info(`${LOGS_PREFIX}Creating SQLEntity: "${name}"`);
    
    // properties is grouped by operation type, making it easy to retrieve and process later.
    for (const p of properties) {
      this.mapProps(p.operations, (p as any).key);
    }
    
    // Log comprehensive entity summary
    logSummary(name, this._table, properties);
  }

  public get table(): string {
    return this._table;
  }

  public set table(table: string) {
    if (!isString(table, "!0"))
      throw new Error(`${LOGS_PREFIX}table must be a string of length > 0`);
    this._table = table;
  }

  public query = { 
    select: (
      first: number = 0,
      rows: number | null = null,
      sortField: string | null = null,
      sortOrder: "ASC" | "DESC" | null = null,
      filters: Filters | null = null
    ): { query: string, args: (Filter["value"])[] } => {
      return this.sel.query(this.table, first, rows, sortField, sortOrder, filters);
    },
    update: (
      rows: Record<string, unknown>[], 
      consumerId?: number | string, 
      consumerName?: string,
    ): { query: string, args: unknown[] } => {
      return this.upd.query(this.table, rows, consumerId, consumerName);
    },
    insert: (
      rows: Record<string, unknown>[], 
      consumerId?: number | string, 
      consumerName?: string,
      rtn: string = ""
    ): { query: string, args: unknown[] } => {
      return this.ins.query(this.table, rows, consumerId, consumerName, rtn);
    },
    delete: (ids: number[]): { query: string, args: number[] } => {
      return del.queryById(this.table, ids);
    },
    deleteArchive: (): string => {
      return del.queryArchived(this.table);
    },
    return: (prop: string): string => {
      return this.ins.rtn(prop);
    }
  };

  public get = ( req: Request, res: Response, next: NextFunction ): void => {
    const l = res.locals;
    const b = req.body;
    const first: number = b?.first ?? 0;
    const rows: number | null = b.rows || null;
    const sortField: string | null = b.sortField || null;
    const sortOrder: "ASC" | "DESC" = b.sortOrder === -1 || b.sortOrder === "DESC" ? "DESC" : "ASC";
    const filters: Filters | null = cleanFilters(b.filters, (this as any).properties || []) || null;
    const pagination: boolean = b.pagination || false;
    const dbClient = l.dbClient || null;

    log.debug(
      `get(first='${first}', rows='${rows}', 
      sortOrder='${sortOrder}', sortField='${sortField}', 
      pagination=${pagination}, filters=${JSON.stringify(filters)}`,
    );

    const { query, args } = this.sel.query(this._table, first, rows, sortField, sortOrder, filters);
    this.sel.execute( query, args, dbClient)
      .then((r: PGResponse) => {
        l.rows = r.rows;
        l.total = r.total;
        next();
      })
      .catch((err: Error) => next(err));
  }

  /**
   * Adds multiple rows to the database table.
   * 
   * @param {Request} req - Express request object. Expected to contain `rows` array in req.body with data to insert.
   * @param {Response} res - Express response object. Uses res.locals to access dbClient, consumerId, and consumerName.
   * @param {NextFunction} next - Express next function for middleware chaining.
   * @returns {Promise<void>} Promise that resolves when all rows are inserted. Added rows with generated IDs are stored in res.locals.rows.
   * @throws {Error} If database insertion fails.
   * 
   * @example
   * // In an Express route
   * app.post('/users', userEntity.add, (req, res) => {
   *   res.json({ users: res.locals.rows });
   * });
   * 
   * // Request body:
   * // { rows: [{ name: 'John', email: 'john@example.com' }] }
   * 
   * // res.locals.rows will contain:
   * // [{ id: 1, name: 'John', email: 'john@example.com' }]
   */
  public add = async ( req: Request, res: Response, next: NextFunction ): Promise<void> => {
    const l = res.locals;
    const rows = req.body.rows;
    const dbClient = l.dbClient || null;
    const cId = l.consumerId;
    const cName = l.consumerName;
    
    log.debug(`${LOGS_PREFIX}addMany(rows=${rows.length}, consumerId=${cId})`);
     
    const rtn = this.ins.rtn("id");
    const chunks = chunk(rows);
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
    l.rows = flatten(chunks);
    next();
  }

  public update = async ( req: Request, res: Response, next: NextFunction ): Promise<void> => {
    const l = res.locals;
    const rows = req.body.rows;
    const dbClient = l.dbClient || null;
    const cId = l.consumerId;
    const cName = l.consumerName;
    
    log.debug(`${LOGS_PREFIX}update(rows=${rows.length}, consumerId=${cId})`);

    const chunks = chunk(rows);
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

  public archive = async ( req: Request, res: Response, next: NextFunction ): Promise<void> => { 
    const l = res.locals;
    let rows = req.body.rows; // list of ids [{id: 1}, {id: 2}]
    const dbClient = l.dbClient || null;
    const cId = l.consumerId;
    const cName = l.consumerName;
    
    log.debug(`${LOGS_PREFIX}archive(rows=${rows.length}, consumerId=${cId})`);

    // Add archived value
    rows = rows.map((id: Record<string, unknown>) => ({
      ...id,
      archived: true,
    }));

    const chunks = chunk(rows);
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

  /**
   * Deletes rows from the database table by their IDs.
   * 
   * @param {Request} req - Express request object. Expected to contain `rows` array in req.body with IDs to delete: [{id: 1}, {id: 2}].
   * @param {Response} res - Express response object. Uses res.locals to access dbClient.
   * @param {NextFunction} next - Express next function for middleware chaining.
   * @returns {Promise<void>} Promise that resolves when rows are deleted.
   * @throws {Error} If database deletion fails.
   * 
   * @example
   * // In an Express route
   * app.delete('/users', userEntity.delete, (req, res) => {
   *   res.json({ success: true });
   * });
   * 
   * // Request body:
   * // { rows: [{ id: 1 }, { id: 2 }] }
   */
  public delete = async ( req: Request, res: Response, next: NextFunction ): Promise<void> => {
    const rows = req.body.rows; // list of ids [{id: 1}, {id: 2}]
    const dbClient = res.locals.dbClient || null;
    
    const ids = rows.map((row: Record<string, unknown>) => row.id as number);
    
    log.debug(`${LOGS_PREFIX}delete ${rows.length} rows : (${ids.join(", ")})`);
    
    const { query, args } = del.queryById(this._table, ids);
    
    try {
      await execute(query, args, dbClient);
    } catch (err: unknown) {
      return next(err);
    }
    next();
  }

  /**
   * Deletes archived rows from the database table that were archived before a specific date.
   * 
   * @param {Request} req - Express request object. Expected to contain `date` in req.body.
   * @param {Response} res - Express response object. Uses res.locals to access dbClient.
   * @param {NextFunction} next - Express next function for middleware chaining.
   * @returns {void}
   * @throws {Error} If database deletion fails.
   * 
   * @example
   * // In an Express route
   * app.delete('/users/archived', userEntity.deleteArchive, (req, res) => {
   *   res.json({ success: true });
   * });
   * 
   * // Request body:
   * // { date: new Date('2025-01-01') }
   */
  public deleteArchive = ( req: Request, res: Response, next: NextFunction ): void => {
    const date = req.body.date;
    const dbClient = res.locals.dbClient || null;
    
    log.debug(`${LOGS_PREFIX}deleteArchive(date=${date})`);
    const q = del.queryArchived(this._table);
    del.executeArchived( date, q, dbClient)
      .then(() => next())
      .catch((err: Error) => next(err));
  }

  private mapProps(operations: Operation[], key: string): void {
    for (const o of operations) {
      switch (o) {
        case "SELECT":
          this.sel.addProp(key);
          break;
        case "UPDATE":
          this.upd.addProp(key);
          break;
        case "INSERT":
          this.ins.addProp(key);
          break;
        default:
          break;
      }
    }
  }
}
