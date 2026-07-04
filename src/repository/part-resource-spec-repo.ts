import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { DB } from "../db/db-connection";
import { partResourceSpecs, resourceSpecs, ResourceSpec } from "../db/schema";
import { logger } from "../util";

export type PartResourceSpecRepoType = {
  // Full list of resource-spec rows (joined to the master) for a part.
  listByPart: (partId: string) => Promise<ResourceSpec[]>;
  // Plain resource-spec ids for a part.
  listResourceSpecIdsByPart: (partId: string) => Promise<string[]>;
  // Replace the entire resource-spec set for a part with the given ids.
  setForPart: (partId: string, resourceSpecIds: string[]) => Promise<void>;
};

const listByPart = async (partId: string): Promise<ResourceSpec[]> => {
  try {
    const rows = await DB.select({ spec: resourceSpecs })
      .from(partResourceSpecs)
      .innerJoin(
        resourceSpecs,
        eq(resourceSpecs.id, partResourceSpecs.resource_spec_id)
      )
      .where(eq(partResourceSpecs.part_id, partId))
      .orderBy(partResourceSpecs.created_at);
    return rows.map((r) => r.spec);
  } catch (error) {
    logger.error(`[PartResourceSpec Repo]: error listing for ${partId}: ${error}`);
    throw error;
  }
};

const listResourceSpecIdsByPart = async (
  partId: string
): Promise<string[]> => {
  try {
    const rows = await DB.select({
      resource_spec_id: partResourceSpecs.resource_spec_id,
    })
      .from(partResourceSpecs)
      .where(eq(partResourceSpecs.part_id, partId))
      .orderBy(partResourceSpecs.created_at);
    return rows.map((r) => r.resource_spec_id);
  } catch (error) {
    logger.error(`[PartResourceSpec Repo]: error listing ids for ${partId}: ${error}`);
    throw error;
  }
};

const setForPart = async (
  partId: string,
  resourceSpecIds: string[]
): Promise<void> => {
  // De-duplicate while preserving order so the join stays clean.
  const unique = [...new Set(resourceSpecIds)];
  try {
    await DB.delete(partResourceSpecs).where(
      eq(partResourceSpecs.part_id, partId)
    );
    if (unique.length > 0) {
      await DB.insert(partResourceSpecs).values(
        unique.map((resourceSpecId) => ({
          id: uuidv7(),
          part_id: partId,
          resource_spec_id: resourceSpecId,
        }))
      );
    }
  } catch (error) {
    logger.error(`[PartResourceSpec Repo]: error setting for ${partId}: ${error}`);
    throw error;
  }
};

export const partResourceSpecRepo: PartResourceSpecRepoType = {
  listByPart,
  listResourceSpecIdsByPart,
  setForPart,
};
