import pool from "./pool";
import perf from "./perf";
import type { Filter, PGResponse } from "./types";

function execute(query: string, args: (Filter["value"])[], clt: any): Promise<Record<string, unknown>> {
  const time = perf.start(query, args);
  const client = clt || pool;
  return client
    .query(query, args)
    .then((res: PGResponse) => {
      perf.end(res, time);
      deleteIdleProperties(res);
      return res;
    })
    .catch((err: { msg: string; message: string; }) => {
      err.msg = `Postgre error: ${err.message}`;
      throw err;
    });
}

function deleteIdleProperties(res: PGResponse): void {
  res.command = undefined;
  res.oid = undefined;
  res.fields = undefined;
  res._parsers = undefined;
  res._types = undefined;
  res.RowCtor = undefined;
  res.rowAsArray = undefined;
}

export {
  execute
};
