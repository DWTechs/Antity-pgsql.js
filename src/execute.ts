import pool from "./pool";
import perf from "./perf";

function execute(query: string, args: string[], clt: any): Promise<any> {
  const time = perf.start(query, args);
  const client = clt || pool;
  return client
    .query(query, args)
    .then((res) => {
      perf.end(res, time);
      deleteIdleProperties(res);
      return res;
    })
    .catch((err) => {
      err.msg = `Postgre error: ${err.message}`;
      throw err;
    });
}

function deleteIdleProperties(res: any): void {
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
