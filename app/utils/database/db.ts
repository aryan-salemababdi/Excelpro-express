import { config as dotenvConfig } from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenvConfig();

const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    ssl: { rejectUnauthorized: false }
});

export {
    pool
};
