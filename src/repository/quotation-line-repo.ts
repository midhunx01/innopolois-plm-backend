import { asc, eq } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewQuotationLine, QuotationLine, quotationLines } from "../db/schema";
import { logger } from "../util";

export type QuotationLineRepoType = {
  createMany: (data: NewQuotationLine[]) => Promise<QuotationLine[]>;
  listByQuotation: (quotationId: string) => Promise<QuotationLine[]>;
};

const createMany = async (
  data: NewQuotationLine[]
): Promise<QuotationLine[]> => {
  try {
    if (data.length === 0) return [];
    return await DB.insert(quotationLines).values(data).returning();
  } catch (error) {
    logger.error(`[QuotationLine Repo]: error creating: ${error}`);
    throw error;
  }
};

const listByQuotation = async (
  quotationId: string
): Promise<QuotationLine[]> => {
  try {
    return await DB
      .select()
      .from(quotationLines)
      .where(eq(quotationLines.quotation_id, quotationId))
      .orderBy(asc(quotationLines.created_at));
  } catch (error) {
    logger.error(`[QuotationLine Repo]: error listing: ${error}`);
    throw error;
  }
};

export const quotationLineRepo: QuotationLineRepoType = {
  createMany,
  listByQuotation,
};
