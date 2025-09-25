import { log } from "@dwtechs/winstan";
import { LOGS_PREFIX } from "../constants";
import type { Filter, PGResponse } from "../types";

function start(query: string, args: (Filter["value"])[]): number {
  const a = JSON.stringify(args);
  const q = query.replace(/[\n\r]+/g, "").replace(/\s{2,}/g, " ");
  log.debug(`${LOGS_PREFIX}Pgsql: { Query : '${q}', Args : '${a}' }`);
  return Date.now();
}

function end(res: PGResponse, time: number): void {
  const r = JSON.stringify(res);
  const t = Date.now() - time;
  log.debug(`Pgsql response in ${t}ms : ${r}`);
}

export default {
  start,
  end,
};
