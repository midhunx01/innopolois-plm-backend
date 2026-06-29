import { and, asc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewUnit, Unit, units } from "../db/schema";
import { logger } from "../util";

export type UnitRepoType = {
  create: (data: NewUnit) => Promise<Unit | null>;
  findById: (id: string) => Promise<Unit | null>;
  findByCode: (code: string) => Promise<Unit | null>;
  list: () => Promise<Unit[]>;
  update: (id: string, data: Partial<NewUnit>) => Promise<Unit | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const create = async (data: NewUnit): Promise<Unit | null> => {
  try {
    const [row] = await DB.insert(units).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Unit Repo]: error creating: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<Unit | null> => {
  try {
    const [row] = await DB
      .select()
      .from(units)
      .where(and(eq(units.id, id), isNull(units.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Unit Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const findByCode = async (code: string): Promise<Unit | null> => {
  try {
    const [row] = await DB
      .select()
      .from(units)
      .where(and(eq(units.code, code), isNull(units.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Unit Repo]: error finding by code: ${error}`);
    throw error;
  }
};

const list = async (): Promise<Unit[]> => {
  try {
    return await DB
      .select()
      .from(units)
      .where(isNull(units.deleted_at))
      .orderBy(asc(units.code));
  } catch (error) {
    logger.error(`[Unit Repo]: error listing: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewUnit>
): Promise<Unit | null> => {
  try {
    const [row] = await DB
      .update(units)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(units.id, id), isNull(units.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Unit Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(units)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(units.id, id), isNull(units.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[Unit Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const unitRepo: UnitRepoType = {
  create,
  findById,
  findByCode,
  list,
  update,
  softDelete,
};
