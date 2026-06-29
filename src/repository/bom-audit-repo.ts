import { asc, eq } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { BomAuditEntry, NewBomAuditEntry, bomAuditEntries } from "../db/schema";
import { logger } from "../util";

export type BomAuditRepoType = {
  create: (data: NewBomAuditEntry) => Promise<BomAuditEntry | null>;
  listByBom: (bomId: string) => Promise<BomAuditEntry[]>;
};

const create = async (
  data: NewBomAuditEntry
): Promise<BomAuditEntry | null> => {
  try {
    const [row] = await DB.insert(bomAuditEntries).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[BomAudit Repo]: error creating entry: ${error}`);
    throw error;
  }
};

const listByBom = async (bomId: string): Promise<BomAuditEntry[]> => {
  try {
    return await DB
      .select()
      .from(bomAuditEntries)
      .where(eq(bomAuditEntries.bom_id, bomId))
      .orderBy(asc(bomAuditEntries.created_at));
  } catch (error) {
    logger.error(`[BomAudit Repo]: error listing for ${bomId}: ${error}`);
    throw error;
  }
};

export const bomAuditRepo: BomAuditRepoType = { create, listByBom };
