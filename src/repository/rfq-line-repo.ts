import { and, asc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewRfqLine, RfqLine, rfqLines } from "../db/schema";
import { logger } from "../util";

export type RfqLineRepoType = {
  createMany: (data: NewRfqLine[]) => Promise<RfqLine[]>;
  findById: (id: string) => Promise<RfqLine | null>;
  listByRfq: (rfqId: string) => Promise<RfqLine[]>;
};

const createMany = async (data: NewRfqLine[]): Promise<RfqLine[]> => {
  try {
    if (data.length === 0) return [];
    return await DB.insert(rfqLines).values(data).returning();
  } catch (error) {
    logger.error(`[RfqLine Repo]: error creating lines: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<RfqLine | null> => {
  try {
    const [row] = await DB
      .select()
      .from(rfqLines)
      .where(and(eq(rfqLines.id, id), isNull(rfqLines.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[RfqLine Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const listByRfq = async (rfqId: string): Promise<RfqLine[]> => {
  try {
    return await DB
      .select()
      .from(rfqLines)
      .where(and(eq(rfqLines.rfq_id, rfqId), isNull(rfqLines.deleted_at)))
      .orderBy(asc(rfqLines.line_no));
  } catch (error) {
    logger.error(`[RfqLine Repo]: error listing for ${rfqId}: ${error}`);
    throw error;
  }
};

export const rfqLineRepo: RfqLineRepoType = {
  createMany,
  findById,
  listByRfq,
};
