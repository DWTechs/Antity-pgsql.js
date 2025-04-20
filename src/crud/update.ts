import { execute as exe } from "./execute";
import { $i } from "./i";
import type { PGResponse, Filter } from "../types";

export class Update {
  private _props: string[] = ["consumerId", "consumerName"];

  public addProp(prop: string): void {
    this._props.splice(this._props.length - 2, 0, prop);
  }

  public query(
    table: string, 
    chunk: Record<string, any>[], 
    consumerId: string | number,
    consumerName: string
  ): { query: string, args: (Filter["value"])[] } {
    chunk = this.addConsumer(chunk, consumerId, consumerName);
    const args: (Filter["value"])[] = chunk.map(row => row.id); // Extract the 'id' field from each row;
    let query = `UPDATE "${table}" SET `;
    let i = args.length+1;
    for (const p of this._props) {
      query += `${p} = CASE `;
      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        query += `WHEN id = $${j+1} THEN $${i++} `;
        args.push(row[p]);
      }
      query += `END, `;
    }
    query = `${query.slice(0, -2)} WHERE id IN ${$i(chunk.length, 0)}`;
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
