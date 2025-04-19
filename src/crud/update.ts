import { chunk } from "@dwtechs/sparray";
import { execute as exe } from "./execute";

export class Update {
  private _props: string[] = ["consumerId", "consumerName"];
  private _cols: string = "*";

  public addProp(prop: string): void {
    this._props.splice(this._props.length - 2, 0, prop);
    this._cols = this._props.join(", ");
  }

  public query(table: string): string {
    return `UPDATE "${table}" `;
  } 

  public async execute(
    rows: Record<string, unknown>[],
    query: string,
    consumerId: string,
    consumerName: string,
    client: any): Promise<void> {
    
    rows = this.addConsumer(rows, consumerId, consumerName);

    const chunks = chunk(rows);

    let i = 0;
    for (const c of chunks) {
      let v = "SET ";
      const args: (string | number | boolean | Date | number[])[] = [];
      for (const p of this._cols) {
        v += `${p} = CASE `;
        for (const row of c) {
          v += `WHEN id = ${row.id} THEN $${i++} `;
          args.push(row[p]);
        }
        v += `END, `;
      }
      query += `${v.slice(0, -2)} WHERE id IN ${this.extractIds(c)}`;
      try {
        await exe(query, args, client);
      } catch (err: unknown) {
        throw err;
      }
    }
    
  }

  // Add consumerId and consumerName to each row
  private  addConsumer(
    rows: Record<string, unknown>[],
    consumerId: string,
    consumerName: string
  ): Record<string, unknown>[] {
    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      consumerId,
      consumerName,
    }));
  }

  private extractIds(chunk: Record<string, any>[]): string {
    const ids = chunk.map(row => row.id); // Extract the 'id' field from each row
    return `(${ids.join(",")})`; // Join the IDs with commas and wrap them in parentheses
  }

};
