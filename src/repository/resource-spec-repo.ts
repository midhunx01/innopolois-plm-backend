import { and, asc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewResourceSpec, ResourceSpec, resourceSpecs } from "../db/schema";
import { logger } from "../util";

export type ResourceSpecRepoType = {
  create: (data: NewResourceSpec) => Promise<ResourceSpec | null>;
  findById: (id: string) => Promise<ResourceSpec | null>;
  findByCode: (code: string) => Promise<ResourceSpec | null>;
  list: () => Promise<ResourceSpec[]>;
  update: (
    id: string,
    data: Partial<NewResourceSpec>
  ) => Promise<ResourceSpec | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const create = async (
  data: NewResourceSpec
): Promise<ResourceSpec | null> => {
  try {
    const [row] = await DB.insert(resourceSpecs).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[ResourceSpec Repo]: error creating: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<ResourceSpec | null> => {
  try {
    const [row] = await DB
      .select()
      .from(resourceSpecs)
      .where(and(eq(resourceSpecs.id, id), isNull(resourceSpecs.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[ResourceSpec Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const findByCode = async (code: string): Promise<ResourceSpec | null> => {
  try {
    const [row] = await DB
      .select()
      .from(resourceSpecs)
      .where(and(eq(resourceSpecs.code, code), isNull(resourceSpecs.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[ResourceSpec Repo]: error finding by code: ${error}`);
    throw error;
  }
};

const list = async (): Promise<ResourceSpec[]> => {
  try {
    return await DB
      .select()
      .from(resourceSpecs)
      .where(isNull(resourceSpecs.deleted_at))
      .orderBy(asc(resourceSpecs.code));
  } catch (error) {
    logger.error(`[ResourceSpec Repo]: error listing: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewResourceSpec>
): Promise<ResourceSpec | null> => {
  try {
    const [row] = await DB
      .update(resourceSpecs)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(resourceSpecs.id, id), isNull(resourceSpecs.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[ResourceSpec Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(resourceSpecs)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(resourceSpecs.id, id), isNull(resourceSpecs.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[ResourceSpec Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const resourceSpecRepo: ResourceSpecRepoType = {
  create,
  findById,
  findByCode,
  list,
  update,
  softDelete,
};
