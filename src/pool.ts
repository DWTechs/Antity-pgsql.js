import Pool from "pg-pool";

// Env vars are destructured at module load, preserving pre-0.22.0
// behavior — only the `new Pool(...)` call itself is deferred to first
// use. Consumers that set env vars before importing the library see
// exactly the same configuration; the change is strictly about *when*
// the pool object is constructed, not what config it captures.
const {
  DB_HOST,
  DB_USER,
  DB_PWD,
  DB_NAME,
  DB_PORT,
  DB_MAX,
} = process.env;

function createPool() {
  return new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PWD,
    database: DB_NAME,
    port: +(DB_PORT || 5432),
    // idleTimeoutMillis: 31536000,
    // connectionTimeoutMillis: 100000,
    max: DB_MAX ? +DB_MAX : 10,
  });
}

let _pool: ReturnType<typeof createPool> | null = null;

/**
 * Returns the singleton pg-pool instance, constructing it on first call.
 *
 * Prior to 0.22.0 the pool was eager (`export default new Pool(...)`),
 * which had two side effects that trickled up to every consumer:
 *
 * 1. Zombie boot on init failure. Any consumer that imported
 *    `@dwtechs/antity-pgsql` acquired an open pg-pool handle at module
 *    load. If the consumer then failed its `Promise.all([...init()])`
 *    before calling `listen()`, Node's event loop stayed alive on the
 *    pool's handle — the process logged "cannot start" and hung. This
 *    forced consumers to add an explicit `process.exit(1)` in their
 *    `.catch` (see `@dwtechs/servpico-express`'s `failFast` helper,
 *    which encapsulates the correct exit sequence).
 *
 * 2. Blocked `sideEffects: false` package hygiene. Bundlers had to
 *    treat the whole module as side-effect-ful — the eager pool
 *    construction *was* a real side effect — preventing tree-shaking
 *    of unused exports.
 *
 * With lazy init the pool only materializes when a query actually
 * runs. Consumers that only use the query-*builder* surface
 * (`SQLEntity.query.select`, `filter`) without ever calling
 * `execute()` never open a pool, and the module becomes safe to
 * declare `sideEffects: false` (see this release's package.json).
 *
 * The check-and-assign is race-free under Node's single-threaded
 * event loop; no locking is required.
 */
function getPool() {
  if (_pool === null) _pool = createPool();
  return _pool;
}

export { getPool };
