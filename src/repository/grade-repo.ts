import { and, asc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { Grade, NewGrade, grades } from "../db/schema";
import { logger } from "../util";

export type GradeRepoType = {
  create: (data: NewGrade) => Promise<Grade | null>;
  findById: (id: string) => Promise<Grade | null>;
  findByCode: (code: string) => Promise<Grade | null>;
  list: () => Promise<Grade[]>;
  update: (id: string, data: Partial<NewGrade>) => Promise<Grade | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const create = async (data: NewGrade): Promise<Grade | null> => {
  try {
    const [row] = await DB.insert(grades).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Grade Repo]: error creating: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<Grade | null> => {
  try {
    const [row] = await DB
      .select()
      .from(grades)
      .where(and(eq(grades.id, id), isNull(grades.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Grade Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const findByCode = async (code: string): Promise<Grade | null> => {
  try {
    const [row] = await DB
      .select()
      .from(grades)
      .where(and(eq(grades.code, code), isNull(grades.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Grade Repo]: error finding by code: ${error}`);
    throw error;
  }
};

const list = async (): Promise<Grade[]> => {
  try {
    return await DB
      .select()
      .from(grades)
      .where(isNull(grades.deleted_at))
      .orderBy(asc(grades.code));
  } catch (error) {
    logger.error(`[Grade Repo]: error listing: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewGrade>
): Promise<Grade | null> => {
  try {
    const [row] = await DB
      .update(grades)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(grades.id, id), isNull(grades.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Grade Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(grades)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(grades.id, id), isNull(grades.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[Grade Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const gradeRepo: GradeRepoType = {
  create,
  findById,
  findByCode,
  list,
  update,
  softDelete,
};
