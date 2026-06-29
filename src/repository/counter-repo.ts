import { sql } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { counters } from "../db/schema";
import { logger } from "../util";

export type CounterRepoType = {
  /** Atomically increment the counter for `key` and return the new value. */
  next: (key: string) => Promise<number>;
};

const next = async (key: string): Promise<number> => {
  try {
    const [row] = await DB
      .insert(counters)
      .values({ key, value: 1 })
      .onConflictDoUpdate({
        target: counters.key,
        set: { value: sql`${counters.value} + 1` },
      })
      .returning({ value: counters.value });
    return row.value;
  } catch (error) {
    logger.error(`[Counter Repo]: error incrementing ${key}: ${error}`);
    throw error;
  }
};

export const counterRepo: CounterRepoType = { next };
