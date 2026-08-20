import 'dotenv/config';

const dbServer = process.env.DB_SERVER || 'localhost';
const [server, instanceFromServer] = dbServer.split('\\');
const instanceName = process.env.DB_INSTANCE || instanceFromServer;
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
const usesWindowsAuth = process.env.DB_AUTH === 'windows';
const { default: sql } = await import(usesWindowsAuth ? 'mssql/msnodesqlv8.js' : 'mssql');
const windowsServer = port ? `${server},${port}` : dbServer;
const encrypt = process.env.DB_ENCRYPT === 'true';
const windowsConnectionString = `Driver={ODBC Driver 18 for SQL Server};Server=${windowsServer};Database=${process.env.DB_NAME};Trusted_Connection=Yes;Encrypt=${encrypt ? 'Yes' : 'No'};TrustServerCertificate=Yes;`;

const config = {
  server,
  ...(port ? { port } : {}),
  database: process.env.DB_NAME,
  ...(usesWindowsAuth ? { connectionString: windowsConnectionString } : {}),
  ...(!usesWindowsAuth ? { user: process.env.DB_USER, password: process.env.DB_PASSWORD } : {}),
  options: {
    encrypt,
    trustServerCertificate: true,
    ...(usesWindowsAuth ? { trustedConnection: true } : {}),
    ...(!usesWindowsAuth && instanceName ? { instanceName } : {})
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};
let pool;
export async function getPool() { if (!pool) pool = await sql.connect(config); return pool; }
export { sql };
