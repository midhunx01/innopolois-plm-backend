import { and, asc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewWarehouse, Warehouse, warehouses } from "../db/schema";
import { logger } from "../util";

export type WarehouseRepoType = {
  create: (data: NewWarehouse) => Promise<Warehouse | null>;
  findById: (id: string) => Promise<Warehouse | null>;
  findByCode: (code: string) => Promise<Warehouse | null>;
  list: () => Promise<Warehouse[]>;
  update: (id: string, data: Partial<NewWarehouse>) => Promise<Warehouse | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const create = async (data: NewWarehouse): Promise<Warehouse | null> => {
  try {
    const [row] = await DB.insert(warehouses).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Warehouse Repo]: error creating: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<Warehouse | null> => {
  try {
    const [row] = await DB
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.id, id), isNull(warehouses.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Warehouse Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const findByCode = async (code: string): Promise<Warehouse | null> => {
  try {
    const [row] = await DB
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.code, code), isNull(warehouses.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Warehouse Repo]: error finding by code: ${error}`);
    throw error;
  }
};

const list = async (): Promise<Warehouse[]> => {
  try {
    return await DB
      .select()
      .from(warehouses)
      .where(isNull(warehouses.deleted_at))
      .orderBy(asc(warehouses.code));
  } catch (error) {
    logger.error(`[Warehouse Repo]: error listing: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewWarehouse>
): Promise<Warehouse | null> => {
  try {
    const [row] = await DB
      .update(warehouses)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(warehouses.id, id), isNull(warehouses.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Warehouse Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(warehouses)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(warehouses.id, id), isNull(warehouses.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[Warehouse Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const warehouseRepo: WarehouseRepoType = {
  create,
  findById,
  findByCode,
  list,
  update,
  softDelete,
};
