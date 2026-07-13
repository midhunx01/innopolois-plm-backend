import { and, asc, desc, eq, ilike, lte, or, sql, SQL } from "drizzle-orm";
import { DB, DbClient } from "../db/db-connection";
import {
  Availability,
  NewStockBalance,
  StockBalance,
  stockBalances,
} from "../db/schema";
import { logger } from "../util";

export interface StockFilters {
  search?: string; // part_number / part_name
  warehouseId?: string;
  partId?: string;
  status?: Availability;
  lowStock?: boolean;
  page: number;
  pageSize: number;
}

export interface WarehouseStockSummary {
  skuCount: number;
  stockValue: string;
  lowStockItems: number;
}

export type StockBalanceRepoType = {
  create: (
    data: NewStockBalance,
    db?: DbClient
  ) => Promise<StockBalance | null>;
  findByPartAndWarehouse: (
    partId: string,
    warehouseId: string,
    db?: DbClient
  ) => Promise<StockBalance | null>;
  list: (
    filters: StockFilters
  ) => Promise<{ rows: StockBalance[]; total: number }>;
  listLowStock: () => Promise<StockBalance[]>;
  update: (
    id: string,
    data: Partial<NewStockBalance>,
    db?: DbClient
  ) => Promise<StockBalance | null>;
  totalOnHandForPart: (partId: string, db?: DbClient) => Promise<number>;
  warehouseSummary: (warehouseId: string) => Promise<WarehouseStockSummary>;
};

const buildWhere = (filters: StockFilters): SQL | undefined => {
  const clauses: (SQL | undefined)[] = [];
  if (filters.search) {
    const term = `%${filters.search}%`;
    clauses.push(
      or(
        ilike(stockBalances.part_number, term),
        ilike(stockBalances.part_name, term)
      )
    );
  }
  if (filters.warehouseId)
    clauses.push(eq(stockBalances.warehouse_id, filters.warehouseId));
  if (filters.partId) clauses.push(eq(stockBalances.part_id, filters.partId));
  if (filters.status) clauses.push(eq(stockBalances.status, filters.status));
  if (filters.lowStock)
    clauses.push(lte(stockBalances.on_hand, stockBalances.reorder_point));
  return clauses.length ? and(...clauses) : undefined;
};

const create = async (
  data: NewStockBalance,
  db: DbClient = DB
): Promise<StockBalance | null> => {
  try {
    const [row] = await db.insert(stockBalances).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[StockBalance Repo]: error creating: ${error}`);
    throw error;
  }
};

const findByPartAndWarehouse = async (
  partId: string,
  warehouseId: string,
  db: DbClient = DB
): Promise<StockBalance | null> => {
  try {
    const [row] = await db
      .select()
      .from(stockBalances)
      .where(
        and(
          eq(stockBalances.part_id, partId),
          eq(stockBalances.warehouse_id, warehouseId)
        )
      )
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[StockBalance Repo]: error finding: ${error}`);
    throw error;
  }
};

const list = async (
  filters: StockFilters
): Promise<{ rows: StockBalance[]; total: number }> => {
  try {
    const where = buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;
    const rows = await DB
      .select()
      .from(stockBalances)
      .where(where)
      .orderBy(desc(stockBalances.updated_at))
      .limit(filters.pageSize)
      .offset(offset);
    const [{ count }] = await DB
      .select({ count: sql<number>`count(*)::int` })
      .from(stockBalances)
      .where(where);
    return { rows, total: count ?? 0 };
  } catch (error) {
    logger.error(`[StockBalance Repo]: error listing: ${error}`);
    throw error;
  }
};

const listLowStock = async (): Promise<StockBalance[]> => {
  try {
    return await DB
      .select()
      .from(stockBalances)
      .where(lte(stockBalances.on_hand, stockBalances.reorder_point))
      .orderBy(asc(stockBalances.on_hand));
  } catch (error) {
    logger.error(`[StockBalance Repo]: error listing low stock: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewStockBalance>,
  db: DbClient = DB
): Promise<StockBalance | null> => {
  try {
    const [row] = await db
      .update(stockBalances)
      .set({ ...data, updated_at: new Date() })
      .where(eq(stockBalances.id, id))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[StockBalance Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const totalOnHandForPart = async (
  partId: string,
  db: DbClient = DB
): Promise<number> => {
  try {
    const [row] = await db
      .select({
        total: sql<number>`coalesce(sum(${stockBalances.on_hand}), 0)::float`,
      })
      .from(stockBalances)
      .where(eq(stockBalances.part_id, partId));
    return row?.total ?? 0;
  } catch (error) {
    logger.error(`[StockBalance Repo]: error totalling part: ${error}`);
    throw error;
  }
};

const warehouseSummary = async (
  warehouseId: string
): Promise<WarehouseStockSummary> => {
  try {
    const [row] = await DB
      .select({
        skuCount: sql<number>`count(*)::int`,
        stockValue: sql<string>`coalesce(sum(${stockBalances.on_hand} * ${stockBalances.unit_cost}), 0)::text`,
        lowStockItems: sql<number>`count(*) filter (where ${stockBalances.on_hand} <= ${stockBalances.reorder_point})::int`,
      })
      .from(stockBalances)
      .where(eq(stockBalances.warehouse_id, warehouseId));
    return {
      skuCount: row?.skuCount ?? 0,
      stockValue: row?.stockValue ?? "0",
      lowStockItems: row?.lowStockItems ?? 0,
    };
  } catch (error) {
    logger.error(`[StockBalance Repo]: error summarising warehouse: ${error}`);
    throw error;
  }
};

export const stockBalanceRepo: StockBalanceRepoType = {
  create,
  findByPartAndWarehouse,
  list,
  listLowStock,
  update,
  totalOnHandForPart,
  warehouseSummary,
};
