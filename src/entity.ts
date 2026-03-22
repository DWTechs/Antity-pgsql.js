import { isString } from '@dwtechs/checkard';
import { chunk, flatten } from "@dwtechs/sparray";
import { log } from "@dwtechs/winstan";
import { Entity } from "@dwtechs/antity";
import { Property } from './property';
import { Select } from "./crud/select";
import { Insert } from "./crud/insert";
import { Update } from "./crud/update";
import { Upsert } from "./crud/upsert";
import { Archive } from "./crud/archive";
import * as del from "./crud/delete";
import { cleanFilters } from "./filter/clean";
import { execute } from "./crud/execute";
import { logSummary } from "./logger";
import { LOGS_PREFIX } from './constants';  
import type { PGResponse, Filters, Filter, Operation } from "./types";
import type { Request, Response, NextFunction } from 'express';

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;
type ExpressMiddlewareAsync = (req: Request, res: Response, next: NextFunction) => Promise<void>;
type SubstackTuple = [ExpressMiddleware, ExpressMiddleware, ExpressMiddlewareAsync];

export class SQLEntity extends Entity {
  private _table: string;
  private _schema: string;
  private sel: Select = new Select();
  private ins: Insert = new Insert();
  private upd: Update = new Update();
  private ups: Upsert = new Upsert();
  private arc: Archive = new Archive();

  constructor(
    name: string, 
    properties: Property[],
    schema: string = 'public'
  ) {
    super(name, properties); // Call the constructor of the base class
    this._table = name;
    this._schema = schema;
    
    log.info(`${LOGS_PREFIX}Creating SQLEntity: "${name}"`);
    
    // properties is grouped by operation type, making it easy to retrieve and process later.
    for (const p of properties) {
      this.mapProps(p.operations, (p as any).key);
    }
    
    // Log comprehensive entity summary
    logSummary(name, this._table, properties);
  }

  /**
   * Gets the table name for the entity.
   * @returns {string} The table name.
   */
  public get table(): string {
    return this._table;
  }

  /**
   * Sets the table name for the entity.
   * @param {string} table - The new table name. Must be a non-empty string.
   * @throws {Error} If the provided table name is not a valid non-empty string.
   */
  public set table(table: string) {
    if (!isString(table, "!0"))
      throw new Error(`${LOGS_PREFIX}table must be a string of length > 0`);
    this._table = table;
  }

  /**
   * Gets the schema name for the entity.
   * @returns {string} The schema name.
   */
  public get schema(): string {
    return this._schema;
  }

  /**
   * Sets the schema name for the entity.
   * @param {string} schema - The new schema name. Must be a non-empty string.
   * @throws {Error} If the provided schema name is not a valid non-empty string.
   */
  public set schema(schema: string) {
    if (!isString(schema, "!0"))
      throw new Error(`${LOGS_PREFIX}schema must be a string of length > 0`);
    this._schema = schema;
  }

  /**
   * Gets the properties of the entity.
   * @returns {Property[]} The list of properties.
   * @example
   * const props = userEntity.properties;
   */
  public get properties(): Property[] {
    return super.properties as Property[];
  }

  /**
   * Middleware stack that combines normalize, validate, and add operations.
   * Use this to create entities with automatic normalization and validation.
   * 
   * @returns {Array<Function>} Array of Express middleware functions: [normalizeArray, validateArray, add]
   * 
   * @example
   * // In an Express route
   * app.post('/users', ...userEntity.substack, (req, res) => {
   *   res.json({ users: res.locals.rows });
   * });
   * 
   * // Request body:
   * // { rows: [{ name: 'John', email: 'john@example.com' }] }
   * 
   * // The data will be:
   * // 1. Normalized (through normalizeArray)
   * // 2. Validated (through validateArray)
   * // 3. Inserted (through add)
   * // 4. Returned in res.locals.rows with generated IDs
   */
  public get addArraySubstack(): SubstackTuple {
    return [this.normalizeArray, this.validateArray, this.add];
  }

  public get addOneSubstack(): SubstackTuple {
    return [this.normalizeOne, this.validateOne, this.add];
  }

  /**
   * Middleware stack that combines normalize, validate, and update operations.
   * Use this to update entities with automatic normalization and validation.
   * 
   * @returns {Array<Function>} Array of Express middleware functions: [normalizeArray, validateArray, update]
   * 
   * @example
   * // In an Express route
   * app.put('/users', ...userEntity.updateSubstack, (req, res) => {
   *   res.json({ success: true });
   * });
   * 
   * // Request body:
   * // { rows: [{ id: 1, name: 'John Updated', email: 'johnupdated@example.com' }] }
   * 
   * // The data will be:
   * // 1. Normalized (through normalizeArray)
   * // 2. Validated (through validateArray)
   * // 3. Updated (through update)
   */
  public get updateArraySubstack(): SubstackTuple {
    return [this.normalizeArray, this.validateArray, this.update];
  }

  public get updateOneSubstack(): SubstackTuple {
    return [this.normalizeOne, this.validateOne, this.update];
  }

  /**
   * Middleware stack that combines normalize, validate, and upsert operations.
   * Use this to upsert entities with automatic normalization and validation.
   * 
   * @returns {Array<Function>} Array of Express middleware functions: [normalizeArray, validateArray, upsert]
   * 
   * @example
   * // In an Express route
   * app.post('/users/upsert', ...userEntity.upsertArraySubstack, (req, res) => {
   *   res.json({ users: res.locals.rows });
   * });
   * 
   * // Request body:
   * // { rows: [{ id: 1, name: 'John Updated', email: 'john@example.com' }], conflictTarget: 'id' }
   * 
   * // The data will be:
   * // 1. Normalized (through normalizeArray)
   * // 2. Validated (through validateArray)
   * // 3. Upserted (through upsert)
   * // 4. Returned in res.locals.rows with IDs
   */
  public get upsertArraySubstack(): SubstackTuple {
    return [this.normalizeArray, this.validateArray, this.upsert];
  }

  public get upsertOneSubstack(): SubstackTuple {
    return [this.normalizeOne, this.validateOne, this.upsert];
  }

  public query = { 
    select: (
      first: number = 0,
      rows: number | null = null,
      sortField: string | null = null,
      sortOrder: "ASC" | "DESC" | null = null,
      filters: Filters | null = null
    ): { query: string, args: (Filter["value"])[] } => {
      return this.sel.query(this.schema, this.table, first, rows, sortField, sortOrder, filters);
    },
    update: (
      rows: Record<string, unknown>[], 
      consumerId?: number | string, 
      consumerName?: string,
    ): { query: string, args: unknown[] } => {
      return this.upd.query(this.schema, this.table, rows, consumerId, consumerName);
    },
    insert: (
      rows: Record<string, unknown>[], 
      consumerId?: number | string, 
      consumerName?: string,
      rtn: string = ""
    ): { query: string, args: unknown[] } => {
      return this.ins.query(this.schema, this.table, rows, consumerId, consumerName, rtn);
    },
    upsert: (
      rows: Record<string, unknown>[],
      conflictTarget: string | string[],
      consumerId?: number | string,
      consumerName?: string,
      rtn: string = ""
    ): { query: string, args: unknown[] } => {
      return this.ups.query(this.schema, this.table, rows, conflictTarget, consumerId, consumerName, rtn);
    },
    delete: (ids: number[]): { query: string, args: number[] } => {
      return del.queryById(this.schema, this.table, ids);
    },
    archive: (
      rows: Record<string, unknown>[],
      consumerId?: number | string,
      consumerName?: string,
    ): { query: string, args: unknown[] } => {
      return this.arc.query(this.schema, this.table, rows, consumerId, consumerName);
    },
    deleteArchive: (): string => {
      return del.queryByDate();
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
    const filters: Filters | null = cleanFilters(b.filters, this.properties) || null;
    const pagination: boolean = b.pagination || false;
    const dbClient = l.dbClient || null;

    log.debug(
      `get(first='${first}', rows='${rows}', 
      sortOrder='${sortOrder}', sortField='${sortField}', 
      pagination=${pagination}, filters=${JSON.stringify(filters)}`,
    );

    const { query, args } = this.sel.query(this._schema, this._table, first, rows, sortField, sortOrder, filters);
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
      const { query, args } = this.ins.query(this._schema, this._table, c, cId, cName, rtn);
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
    const r = req.body.rows;
    const dbClient = l.dbClient || null;
    const cId = l.consumerId;
    const cName = l.consumerName;
    
    log.debug(`${LOGS_PREFIX}update(rows=${r.length}, consumerId=${cId})`);

    const chunks = chunk(r);
    for (const c of chunks) {
      const { query, args } = this.upd.query(this._schema, this._table, c, cId, cName);
      try {
        await execute(query, args, dbClient);
      } catch (err: unknown) {
        return next(err);
      }
    }
    l.rows = r;
    next();
  }

  /**
   * Upserts (inserts or updates) rows in the database table.
   * If a row with the specified conflict target already exists, it will be updated; otherwise, it will be inserted.
   * 
   * @param {Request} req - Express request object. Expected to contain `rows` array and `conflictTarget` in req.body.
   * @param {Response} res - Express response object. Uses res.locals to access dbClient, consumerId, and consumerName.
   * @param {NextFunction} next - Express next function for middleware chaining.
   * @returns {Promise<void>} Promise that resolves when all rows are upserted. Upserted rows with IDs are stored in res.locals.rows.
   * @throws {Error} If database upsert fails or conflictTarget is missing.
   * 
   * @example
   * // In an Express route
   * app.post('/users/upsert', userEntity.upsert, (req, res) => {
   *   res.json({ users: res.locals.rows });
   * });
   * 
   * // Request body:
   * // { rows: [{ id: 1, name: 'John', email: 'john@example.com' }], conflictTarget: 'id' }
   * 
   * // res.locals.rows will contain:
   * // [{ id: 1, name: 'John', email: 'john@example.com' }]
   */
  public upsert = async ( req: Request, res: Response, next: NextFunction ): Promise<void> => {
    const l = res.locals;
    const rows = req.body.rows;
    const conflictTarget = req.body.conflictTarget;
    const dbClient = l.dbClient || null;
    const cId = l.consumerId;
    const cName = l.consumerName;
    
    if (!conflictTarget) {
      return next({ status: 400, msg: "Missing conflictTarget for upsert operation" });
    }
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return next({ status: 400, msg: "Missing or empty rows array for upsert operation" });
    }
    
    log.debug(`${LOGS_PREFIX}upsert(rows=${rows.length}, conflictTarget=${conflictTarget}, consumerId=${cId})`);
    
    const rtn = this.ups.rtn("id");
    const chunks = chunk(rows);
    for (const c of chunks) {
      const { query, args } = this.ups.query(this._schema, this._table, c, conflictTarget, cId, cName, rtn);
      let db: PGResponse;
      try {
        db = await execute(query, args, dbClient);
      } catch (err: unknown) {
        return next(err);
      }
      // update ids in rows
      const r = db.rows;
      for (let i = 0; i < c.length; i++) {
        c[i].id = r[i].id;
      }
    }
    l.rows = flatten(chunks);
    next();
  }

  public archive = async ( req: Request, res: Response, next: NextFunction ): Promise<void> => { 
    const l = res.locals;
    let r = req.body.rows; // list of ids [{id: 1}, {id: 2}]
    const dbClient = l.dbClient || null;
    const cId = l.consumerId;
    const cName = l.consumerName;
    
    log.debug(`${LOGS_PREFIX}archive(rows=${r.length}, consumerId=${cId})`);

    const chunks = chunk(r);
    for (const c of chunks) {
      const { query, args } = this.arc.query(this._schema, this._table, c, cId, cName);
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
    
    const { query, args } = del.queryById(this._schema, this._table, ids);
    
    try {
      await execute(query, args, dbClient);
    } catch (err: unknown) {
      return next(err);
    }
    next();
  }

  /**
   * Deletes archived rows from the database table that were archived before a specific date.
   * Uses the hard_delete PostgreSQL function to delete rows and their history.
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
    
    log.debug(`${LOGS_PREFIX}deleteArchive(schema=${this._schema}, table=${this._table}, date=${date})`);
    del.executeArchived(this._schema, this._table, date, del.queryByDate(), dbClient)
      .then(() => next())
      .catch((err: Error) => next(err));
  }

  /**
   * Retrieves the history for a specific row by its ID.
   * 
   * @param {Request} req - Express request object. Expected to contain `id` in req.params.
   * @param {Response} res - Express response object. Uses res.locals to access dbClient.
   * @param {NextFunction} next - Express next function for middleware chaining.
   * @returns {void}
   * @throws {Error} If database query fails or ID is missing.
   * 
   * @example
   * // In an Express route
   * app.get('/users/:id/history', userEntity.getHistory, (req, res) => {
   *   res.json({ history: res.locals.history, total: res.locals.total });
   * });
   * 
   * // Request params:
   * // { id: 1 }
   * 
   * // res.locals will contain:
   * // { history: [...], total: 5 }
   */
  public getHistory = ( req: Request, res: Response, next: NextFunction ): void => {
    const id = req.params.id;
    const dbClient = res.locals.dbClient || null;
    
    if (!id) {
      return next({ status: 400, msg: "Missing id" });
    }
    
    log.debug(`${LOGS_PREFIX}getHistory(schema=${this._schema}, table=${this._table}, id=${id})`);
    
    const sql = `
      SELECT id, tstamp, operation, "consumerId", "consumerName"
      FROM log.history
      WHERE "schemaName" = $1 
        AND "tableName" = $2
        AND CAST(record->>'id' AS INT) = $3
      ORDER BY tstamp ASC
    `;
    
    execute(sql, [this._schema, this._table, id], dbClient)
      .then((r: PGResponse) => {
        const { rowCount, rows } = r;
        if (!rowCount) {
          return next({ status: 404, msg: "History not found" });
        }
        res.locals.history = rows;
        res.locals.total = rowCount;
        next();
      })
      .catch((err: Error) => next(err));
  }

  private mapProps(operations: Operation[], key: string): void {
    let hasInsert = false;
    let hasUpdate = false;
    
    for (const o of operations) {
      switch (o) {
        case "SELECT":
          this.sel.addProp(key);
          break;
        case "UPDATE":
          this.upd.addProp(key);
          hasUpdate = true;
          break;
        case "INSERT":
          this.ins.addProp(key);
          hasInsert = true;
          break;
        default:
          break;
      }
    }
    
    // Properties with both INSERT and UPDATE are automatically included in UPSERT
    if (hasInsert && hasUpdate) {
      this.ups.addProp(key);
    }
  }
}
