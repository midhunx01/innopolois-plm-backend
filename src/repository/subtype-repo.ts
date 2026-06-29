import { and, asc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewSubtype, Subtype, subtypes } from "../db/schema";
import { logger } from "../util";

export type SubtypeRepoType = {
  create: (data: NewSubtype) => Promise<Subtype | null>;
  findById: (id: string) => Promise<Subtype | null>;
  findByCategoryAndCode: (
    categoryId: string,
    code: string
  ) => Promise<Subtype | null>;
  listByCategory: (categoryId: string) => Promise<Subtype[]>;
  update: (id: string, data: Partial<NewSubtype>) => Promise<Subtype | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const create = async (data: NewSubtype): Promise<Subtype | null> => {
  try {
    const [row] = await DB.insert(subtypes).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Subtype Repo]: error creating subtype: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<Subtype | null> => {
  try {
    const [row] = await DB
      .select()
      .from(subtypes)
      .where(and(eq(subtypes.id, id), isNull(subtypes.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Subtype Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const findByCategoryAndCode = async (
  categoryId: string,
  code: string
): Promise<Subtype | null> => {
  try {
    const [row] = await DB
      .select()
      .from(subtypes)
      .where(
        and(
          eq(subtypes.category_id, categoryId),
          eq(subtypes.code, code),
          isNull(subtypes.deleted_at)
        )
      )
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Subtype Repo]: error finding by category+code: ${error}`);
    throw error;
  }
};

const listByCategory = async (categoryId: string): Promise<Subtype[]> => {
  try {
    return await DB
      .select()
      .from(subtypes)
      .where(
        and(eq(subtypes.category_id, categoryId), isNull(subtypes.deleted_at))
      )
      .orderBy(asc(subtypes.name));
  } catch (error) {
    logger.error(`[Subtype Repo]: error listing: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewSubtype>
): Promise<Subtype | null> => {
  try {
    const [row] = await DB
      .update(subtypes)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(subtypes.id, id), isNull(subtypes.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Subtype Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(subtypes)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(subtypes.id, id), isNull(subtypes.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[Subtype Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const subtypeRepo: SubtypeRepoType = {
  create,
  findById,
  findByCategoryAndCode,
  listByCategory,
  update,
  softDelete,
};
