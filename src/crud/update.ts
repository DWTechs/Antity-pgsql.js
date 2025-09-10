import { add as spAdd } from "@dwtechs/sparray";
import { execute as exe } from "./execute";
import { $i } from "./i";
import { quoteIfUppercase } from "./quote";
import type { PGResponse, Filter } from "../types";

export class Update {
  private _props: string[] = ["consumerId", "consumerName"];

  public addProp(prop: string): void {
    this._props = spAdd(this._props, quoteIfUppercase(prop), this._props.length - 2) as string[];
  }

  public query(
    table: string, 
    rows: Record<string, any>[],
    consumerId: string | number,
    consumerName: string
  ): { query: string, args: (Filter["value"])[] } {
    rows = this.addConsumer(rows, consumerId, consumerName);
    const l = rows.length;
    const args: (Filter["value"])[] = rows.map(row => row.id); // Extract the 'id' field from each row;
    let query = `UPDATE "${quoteIfUppercase(table)}" SET `;
    let i = args.length+1;
    for (const p of this._props) {
      if (rows[0][p] === undefined) // do not create case if prop is not in the first row
        continue;
      query += `${p} = CASE `;
      for (let j = 0; j < l; j++) {
        const row = rows[j];
        query += `WHEN id = $${j+1} THEN $${i++} `;
        args.push(row[p]);
      }
      query += `END, `;
    }
    query = `${query.slice(0, -2)} WHERE id IN ${$i(l, 0)}`;
    return { query, args };
  } 

  public async execute(
    query: string,
    args: (Filter["value"])[],
    client: any): Promise<PGResponse> {
    
    return exe( query, args, client );
    
  }

  // Add consumerId and consumerName to each row
  private  addConsumer(
    rows: Record<string, unknown>[],
    consumerId: string | number,
    consumerName: string
  ): Record<string, unknown>[] {
    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      consumerId,
      consumerName,
    }));
  }
};
