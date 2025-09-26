import { isString } from '@dwtechs/checkard';
import { chunk, flatten } from "@dwtechs/sparray";
import { log } from "@dwtechs/winstan";
import { Entity, Method } from "@dwtechs/antity";
import { Property } from './property';
import { Select } from "./crud/select";
import { Insert } from "./crud/insert";
import { Update } from "./crud/update";
import * as del from "./crud/delete";
import { filter } from "./filter/filter";
import { cleanFilters } from "./filter/clean";
import { execute } from "./crud/execute";
import { LOGS_PREFIX } from './constants';  
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
      throw new Error(`${LOGS_PREFIX}table must be a string of length > 0`);
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
  };

  public get = ( req: Request, res: Response, next: NextFunction ): void => {
    const l = res.locals;
    const b = req.body;
    const first: number = b?.first ?? 0;
    const rows: number | null = b.rows || null;
    const sortField: string | null = b.sortField || null;
    const sortOrder: "ASC" | "DESC" = b.sortOrder === -1 || b.sortOrder === "DESC" ? "DESC" : "ASC";
    const filters: Filters | null = cleanFilters(b.filters, this.getProp.bind(this)) || null;
    const pagination: boolean = b.pagination || false;
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

  public delete = ( req: Request, res: Response, next: NextFunction ): void => {
    const date = req.body.date;
    const dbClient = res.locals.dbClient || null;
    
    log.debug(`${LOGS_PREFIX}delete archived`);
    const q = del.query(this._table);
    del.execute( date, q, dbClient)
      .then(() => next())
      .catch((err: Error) => next(err));
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
