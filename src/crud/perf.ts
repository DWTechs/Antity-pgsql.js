import { log } from "@dwtechs/winstan";
import { LOGS_PREFIX } from "../constants";
import type { SqlValue, PGResponse } from "../types";

function start(query: string, args: SqlValue[]): number {
  log.debug(() => {
    const a = JSON.stringify(args);
    const q = query.replace(/[\n\r]+/g, "").replace(/\s{2,}/g, " ");
    return `${LOGS_PREFIX}Pgsql: { Query : '${q}', Args : '${a}' }`;
  });
  return Date.now();
}

function end(res: PGResponse, time: number): void {
  log.debug(() => `Pgsql response in ${Date.now() - time}ms : ${JSON.stringify(res)}`);
}

export default {
  start,
  end,
};
