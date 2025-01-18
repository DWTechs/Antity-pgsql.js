import { log } from "@dwtechs/winstan";
import { Entity } from "@dwtechs/antity";
import map from "./map";
import check from "./check";
import { execute } from "./execute";
import { addContition, where, orderBy, limit } from "./clause";
import type { Type, Filters, Filter, LogicalOperator } from "./types";
import type { Property } from "@dwtechs/antity";

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
  private table: string;
  private cols: Record<Operation, string[]>;
  private unsafeProps: string[];
  private properties: Property[];
  private defaultLogicalOperator: LogicalOperator = "AND";

  // constructor(table: string, properties: Property[]) {
  //   super(table, properties); // Call the constructor of the base class
  // }

  public select( 
    first: number,
    rows: number,
    sortOrder: string,
    sortField: string,
    filters: Filters | null,
    pagination: boolean
  ): Promise<any> {

    const conditions: string[] = [];
    let i = 1;
    const args: (Filter["value"])[] = [];
  
    if (filters) {
      for (const key in filters) {
        const propType = this.getPropertyType(key);
        if (!propType) {
          log.info(`Skipping unknown property: ${key}`);
          continue;
        }
        
        const type = map.type(propType); // transform from entity type to valid sql filter type
        const filter = filters[key];
        const { value, subProps, matchMode } = filter;
        
        if (matchMode && !check.matchMode(type, matchMode)) { // check if match mode is compatible with sql type
          log.info(`Skipping invalid match mode: ${matchMode} for type: ${type} at property: ${key}`);
          continue;
        }

        conditions.push(addContition(key, i, matchMode));
        args.push(value);
        i++;
      }
    }

    const filterClause = 
        where(conditions, this.defaultLogicalOperator) 
      + orderBy(sortField, sortOrder) 
      + limit(rows, first);

    const query = `SELECT ${this.getCols("select", true, pagination)} FROM ${this.getTable()} ${filterClause}`;
    return execute(query, args, null);

  }

  private getPropertyType(key: string): Type {
    return this.properties[key]?.type || null;
  }

}


// /**
//  * Inserts data into a specified table with the given columns, values, and optional return column.
//  *
//  * @param {string} table - The name of the table to insert into.
//  * @param {string} cols - The columns to insert into, separated by commas.
//  * @param {string} values - The values to insert, separated by commas.
//  * @param {Array} args - The arguments for the query.
//  * @param {string} [rtn] - The column to return after the insertion.
//  * @param {object} [client] - The PostgreSQL client to use for the query.
//  * @return {Promise} A promise that resolves with the result of the query.
//  */
// function insert(table: string, cols: string, values: string, args: string[], rtn: string, client: any): Promise<any> {
//   const rtnQuery = rtn ? `RETURNING ${rtn}` : "";
//   const query = `INSERT INTO "${table}" (${cols}) VALUES ${values} ${rtnQuery}`;
//   return execute(query, args, client);
// }

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
