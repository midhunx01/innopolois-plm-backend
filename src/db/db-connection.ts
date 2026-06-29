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
