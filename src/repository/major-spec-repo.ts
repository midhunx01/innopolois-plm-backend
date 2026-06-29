import { and, asc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { MajorSpec, NewMajorSpec, majorSpecs } from "../db/schema";
import { logger } from "../util";

export type MajorSpecRepoType = {
  create: (data: NewMajorSpec) => Promise<MajorSpec | null>;
  findById: (id: string) => Promise<MajorSpec | null>;
  findByCode: (code: string) => Promise<MajorSpec | null>;
  list: () => Promise<MajorSpec[]>;
  update: (id: string, data: Partial<NewMajorSpec>) => Promise<MajorSpec | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const create = async (data: NewMajorSpec): Promise<MajorSpec | null> => {
  try {
    const [row] = await DB.insert(majorSpecs).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[MajorSpec Repo]: error creating: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<MajorSpec | null> => {
  try {
    const [row] = await DB
      .select()
      .from(majorSpecs)
      .where(and(eq(majorSpecs.id, id), isNull(majorSpecs.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[MajorSpec Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const findByCode = async (code: string): Promise<MajorSpec | null> => {
  try {
    const [row] = await DB
      .select()
      .from(majorSpecs)
      .where(and(eq(majorSpecs.code, code), isNull(majorSpecs.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[MajorSpec Repo]: error finding by code: ${error}`);
    throw error;
  }
};

const list = async (): Promise<MajorSpec[]> => {
  try {
    return await DB
      .select()
      .from(majorSpecs)
      .where(isNull(majorSpecs.deleted_at))
      .orderBy(asc(majorSpecs.code));
  } catch (error) {
    logger.error(`[MajorSpec Repo]: error listing: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewMajorSpec>
): Promise<MajorSpec | null> => {
  try {
    const [row] = await DB
      .update(majorSpecs)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(majorSpecs.id, id), isNull(majorSpecs.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[MajorSpec Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(majorSpecs)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(majorSpecs.id, id), isNull(majorSpecs.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[MajorSpec Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const majorSpecRepo: MajorSpecRepoType = {
  create,
  findById,
  findByCode,
  list,
  update,
  softDelete,
};
