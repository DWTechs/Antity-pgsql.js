import { chunk, flatten } from "@dwtechs/sparray";
import { execute as exe  } from "./execute";
import type { PGResponse } from "../types";

export class Insert {

  private _props: string[] = ["consumerId", "consumerName"];
  private _cols: string = "*";

  public addProp(prop: string): void {
    this._props.splice(this._props.length - 2, 0, prop);
    this._cols = this._props.join(", ");
  }

  public query(table: string): string {
    return `INSERT INTO "${table}" (${this._cols}) VALUES `;
  } 

  public rtn(prop: string): string {
    return ` RETURNING "${prop}"`;
  }

  public async execute(
    rows: Record<string, any>[],
    query: string,
    rtn: string,
    consumerId: string,
    consumerName: string,
    client: any): Promise<Record<string, any>[]> {
    
    const chunks = chunk(rows);

    for (const c of chunks) {
      let values = "";
      const args = [];
      for (const row of c) {
        values += `${this.$i(row.length + 2)}, `;
        args.push(...row, consumerId, consumerName);
      }
      values = `${values.slice(0, -2)}`;
      let db: PGResponse;
      const q = `${query}${values}${rtn}`;
      try {
        db = await exe(q, args, client);
      } catch (err: unknown) {
        throw err;
      }
      // add new id to new rows
      const r = db.rows;
      for (let i = 0; i < c.length; i++) {
        c[i] = r[i].id;
      }
    }
    return flatten(chunks);

  }

  /**
  * Generates a PostgreSQL query string with placeholders for a given quantity of values.
  *
  * @param {number} qty - The quantity of values to generate placeholders for.
  * @return {string} The generated query string with placeholders.
  */
  private $i(qty: number): string {
    return `(${Array.from({ length: qty }, (_, i) => `$${i + 1}`).join(", ")})`;
  }
};
