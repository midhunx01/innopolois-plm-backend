import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { config } from "../config";
import { logger } from "../util";

const pool = new Pool({
  connectionString: config.db.url,
  ssl:
    config.app.environment === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 5,
});

export const DB: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

// Either the pooled DB or a transaction handle. Repo methods that participate in
// a transaction accept this (defaulting to `DB`) so callers can run several
// writes atomically via `DB.transaction(async (tx) => { repo.x(..., tx) })`.
export type DbClient =
  | typeof DB
  | Parameters<Parameters<typeof DB.transaction>[0]>[0];

export async function connectToDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    client.release();
    logger.info("Connected to the database");
  } catch (err) {
    logger.error(`Database connection error: ${err}`);
    throw err;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    logger.info("Database connection pool closed");
  } catch (err) {
    logger.error(`Error closing database connection pool: ${err}`);
    throw err;
  }
}
