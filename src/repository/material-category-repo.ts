import { and, asc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import {
  MaterialCategory,
  NewMaterialCategory,
  materialCategories,
} from "../db/schema";
import { logger } from "../util";

export type MaterialCategoryRepoType = {
  create: (data: NewMaterialCategory) => Promise<MaterialCategory | null>;
  findById: (id: string) => Promise<MaterialCategory | null>;
  findByTypeCode: (typeCode: string) => Promise<MaterialCategory | null>;
  findByName: (name: string) => Promise<MaterialCategory | null>;
  list: () => Promise<MaterialCategory[]>;
  update: (
    id: string,
    data: Partial<NewMaterialCategory>
  ) => Promise<MaterialCategory | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const create = async (
  data: NewMaterialCategory
): Promise<MaterialCategory | null> => {
  try {
    const [row] = await DB.insert(materialCategories).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[MaterialCategory Repo]: error creating category: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<MaterialCategory | null> => {
  try {
    const [row] = await DB
      .select()
      .from(materialCategories)
      .where(
        and(eq(materialCategories.id, id), isNull(materialCategories.deleted_at))
      )
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[MaterialCategory Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const findByTypeCode = async (
  typeCode: string
): Promise<MaterialCategory | null> => {
  try {
    const [row] = await DB
      .select()
      .from(materialCategories)
      .where(
        and(
          eq(materialCategories.type_code, typeCode),
          isNull(materialCategories.deleted_at)
        )
      )
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[MaterialCategory Repo]: error finding by code: ${error}`);
    throw error;
  }
};

const findByName = async (name: string): Promise<MaterialCategory | null> => {
  try {
    const [row] = await DB
      .select()
      .from(materialCategories)
      .where(
        and(
          eq(materialCategories.name, name),
          isNull(materialCategories.deleted_at)
        )
      )
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[MaterialCategory Repo]: error finding by name: ${error}`);
    throw error;
  }
};

const list = async (): Promise<MaterialCategory[]> => {
  try {
    return await DB
      .select()
      .from(materialCategories)
      .where(isNull(materialCategories.deleted_at))
      .orderBy(asc(materialCategories.name));
  } catch (error) {
    logger.error(`[MaterialCategory Repo]: error listing: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewMaterialCategory>
): Promise<MaterialCategory | null> => {
  try {
    const [row] = await DB
      .update(materialCategories)
      .set({ ...data, updated_at: new Date() })
      .where(
        and(eq(materialCategories.id, id), isNull(materialCategories.deleted_at))
      )
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[MaterialCategory Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(materialCategories)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(
        and(eq(materialCategories.id, id), isNull(materialCategories.deleted_at))
      )
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[MaterialCategory Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const materialCategoryRepo: MaterialCategoryRepoType = {
  create,
  findById,
  findByTypeCode,
  findByName,
  list,
  update,
  softDelete,
};
