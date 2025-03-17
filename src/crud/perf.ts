import { log } from "@dwtechs/winstan";
import type { Filter } from "../types";

function start(query: string, args: (Filter["value"])[]): number {
  log.debug(
    `Pgsql: { Query : '${query
      .replace(/[\n\r]+/g, "")
      .replace(/\s{2,}/g, " ")}', Args : '${JSON.stringify(args)}' }`,
  );
  return Date.now();
}

function end(res: PGRes, time: number): void {
  log.debug(`Pgsql response in ${Date.now() - time}ms : ${JSON.stringify(res)}`);
}

export default {
  start,
  end,
};
