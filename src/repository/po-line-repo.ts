import { and, asc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewPoLine, PoLine, poLines } from "../db/schema";
import { logger } from "../util";

export type PoLineRepoType = {
  createMany: (data: NewPoLine[]) => Promise<PoLine[]>;
  findById: (id: string) => Promise<PoLine | null>;
  listByPo: (poId: string) => Promise<PoLine[]>;
  update: (id: string, data: Partial<NewPoLine>) => Promise<PoLine | null>;
};

const createMany = async (data: NewPoLine[]): Promise<PoLine[]> => {
  try {
    if (data.length === 0) return [];
    return await DB.insert(poLines).values(data).returning();
  } catch (error) {
    logger.error(`[PoLine Repo]: error creating lines: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<PoLine | null> => {
  try {
    const [row] = await DB
      .select()
      .from(poLines)
      .where(and(eq(poLines.id, id), isNull(poLines.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[PoLine Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const listByPo = async (poId: string): Promise<PoLine[]> => {
  try {
    return await DB
      .select()
      .from(poLines)
      .where(and(eq(poLines.po_id, poId), isNull(poLines.deleted_at)))
      .orderBy(asc(poLines.line_no));
  } catch (error) {
    logger.error(`[PoLine Repo]: error listing for ${poId}: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewPoLine>
): Promise<PoLine | null> => {
  try {
    const [row] = await DB
      .update(poLines)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(poLines.id, id), isNull(poLines.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[PoLine Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

export const poLineRepo: PoLineRepoType = {
  createMany,
  findById,
  listByPo,
  update,
};
