import { asc, eq } from "drizzle-orm";
import { DB } from "../db/db-connection";
import {
  BomAuditEntry,
  NewBomAuditEntry,
  bomAuditEntries,
  users,
} from "../db/schema";
import { logger } from "../util";

// Audit entry enriched with the actor's display fields so any role viewing the
// BOM can see who performed each transition — without needing the admin-only
// users list to resolve user_id → name (frontend audit-trail avatar bug).
export type BomAuditEntryWithActor = BomAuditEntry & {
  user_name: string | null;
  user_initials: string | null;
  user_hue: number | null;
};

export type BomAuditRepoType = {
  create: (data: NewBomAuditEntry) => Promise<BomAuditEntry | null>;
  listByBom: (bomId: string) => Promise<BomAuditEntryWithActor[]>;
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

const listByBom = async (
  bomId: string
): Promise<BomAuditEntryWithActor[]> => {
  try {
    return await DB
      .select({
        id: bomAuditEntries.id,
        bom_id: bomAuditEntries.bom_id,
        from_stage: bomAuditEntries.from_stage,
        to_stage: bomAuditEntries.to_stage,
        action: bomAuditEntries.action,
        comment: bomAuditEntries.comment,
        user_id: bomAuditEntries.user_id,
        created_at: bomAuditEntries.created_at,
        user_name: users.name,
        user_initials: users.initials,
        user_hue: users.hue,
      })
      .from(bomAuditEntries)
      .leftJoin(users, eq(users.id, bomAuditEntries.user_id))
      .where(eq(bomAuditEntries.bom_id, bomId))
      .orderBy(asc(bomAuditEntries.created_at));
  } catch (error) {
    logger.error(`[BomAudit Repo]: error listing for ${bomId}: ${error}`);
    throw error;
  }
};

export const bomAuditRepo: BomAuditRepoType = { create, listByBom };
