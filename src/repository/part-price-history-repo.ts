import { desc, eq } from "drizzle-orm";
import { DB, DbClient } from "../db/db-connection";
import {
  NewPartPriceHistory,
  PartPriceHistory,
  partPriceHistory,
} from "../db/schema";
import { logger } from "../util";

export type PartPriceHistoryRepoType = {
  create: (
    data: NewPartPriceHistory,
    db?: DbClient
  ) => Promise<PartPriceHistory | null>;
  // Newest price event first.
  listByPart: (partId: string) => Promise<PartPriceHistory[]>;
};

const create = async (
  data: NewPartPriceHistory,
  db: DbClient = DB
): Promise<PartPriceHistory | null> => {
  try {
    const [row] = await db.insert(partPriceHistory).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[PartPriceHistory Repo]: error creating: ${error}`);
    throw error;
  }
};

const listByPart = async (partId: string): Promise<PartPriceHistory[]> => {
  try {
    return await DB
      .select()
      .from(partPriceHistory)
      .where(eq(partPriceHistory.part_id, partId))
      .orderBy(desc(partPriceHistory.effective_date));
  } catch (error) {
    logger.error(`[PartPriceHistory Repo]: error listing for ${partId}: ${error}`);
    throw error;
  }
};

export const partPriceHistoryRepo: PartPriceHistoryRepoType = {
  create,
  listByPart,
};
