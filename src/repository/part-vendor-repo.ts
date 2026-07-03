import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { DB } from "../db/db-connection";
import { partVendors, suppliers, Supplier } from "../db/schema";
import { logger } from "../util";

export type PartVendorRepoType = {
  // Full list of preferred-vendor rows (joined to vendor details) for a part.
  listByPart: (partId: string) => Promise<Supplier[]>;
  // Plain vendor ids for a part (used for defaults/aggregation).
  listVendorIdsByPart: (partId: string) => Promise<string[]>;
  // Replace the entire preferred-vendor set for a part with the given ids.
  setForPart: (partId: string, vendorIds: string[]) => Promise<void>;
};

const listByPart = async (partId: string): Promise<Supplier[]> => {
  try {
    const rows = await DB.select({ vendor: suppliers })
      .from(partVendors)
      .innerJoin(suppliers, eq(suppliers.id, partVendors.vendor_id))
      .where(eq(partVendors.part_id, partId))
      .orderBy(partVendors.created_at);
    return rows.map((r) => r.vendor);
  } catch (error) {
    logger.error(`[PartVendor Repo]: error listing for ${partId}: ${error}`);
    throw error;
  }
};

const listVendorIdsByPart = async (partId: string): Promise<string[]> => {
  try {
    const rows = await DB.select({ vendor_id: partVendors.vendor_id })
      .from(partVendors)
      .where(eq(partVendors.part_id, partId))
      .orderBy(partVendors.created_at);
    return rows.map((r) => r.vendor_id);
  } catch (error) {
    logger.error(`[PartVendor Repo]: error listing ids for ${partId}: ${error}`);
    throw error;
  }
};

const setForPart = async (
  partId: string,
  vendorIds: string[]
): Promise<void> => {
  // De-duplicate while preserving order so the join stays clean.
  const unique = [...new Set(vendorIds)];
  try {
    await DB.delete(partVendors).where(eq(partVendors.part_id, partId));
    if (unique.length > 0) {
      await DB.insert(partVendors).values(
        unique.map((vendorId) => ({
          id: uuidv7(),
          part_id: partId,
          vendor_id: vendorId,
        }))
      );
    }
  } catch (error) {
    logger.error(`[PartVendor Repo]: error setting for ${partId}: ${error}`);
    throw error;
  }
};

export const partVendorRepo: PartVendorRepoType = {
  listByPart,
  listVendorIdsByPart,
  setForPart,
};
