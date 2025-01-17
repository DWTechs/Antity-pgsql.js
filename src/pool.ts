import Pool from "pg-pool";
const { DB_HOST, DB_USER, DB_PWD, DB_NAME, DB_PORT, DB_MAX } = process.env;

export default new Pool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PWD,
  database: DB_NAME,
  port: DB_PORT,
  // idleTimeoutMillis: 31536000,
  // connectionTimeoutMillis: 100000,
  max: DB_MAX,
});
