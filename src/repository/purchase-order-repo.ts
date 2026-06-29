import { and, desc, eq, ilike, isNull, or, sql, SQL } from "drizzle-orm";
import { DB } from "../db/db-connection";
import {
  NewPurchaseOrder,
  PoStatus,
  PurchaseOrder,
  purchaseOrders,
} from "../db/schema";
import { logger } from "../util";

export interface PoFilters {
  search?: string; // number / supplier_name
  status?: PoStatus;
  supplierId?: string;
  page: number;
  pageSize: number;
}

export type PurchaseOrderRepoType = {
  create: (data: NewPurchaseOrder) => Promise<PurchaseOrder | null>;
  findById: (id: string) => Promise<PurchaseOrder | null>;
  list: (filters: PoFilters) => Promise<{ rows: PurchaseOrder[]; total: number }>;
  update: (
    id: string,
    data: Partial<NewPurchaseOrder>
  ) => Promise<PurchaseOrder | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const buildWhere = (filters: PoFilters): SQL | undefined => {
  const clauses: (SQL | undefined)[] = [isNull(purchaseOrders.deleted_at)];
  if (filters.search) {
    const term = `%${filters.search}%`;
    clauses.push(
      or(
        ilike(purchaseOrders.number, term),
        ilike(purchaseOrders.supplier_name, term)
      )
    );
  }
  if (filters.status) clauses.push(eq(purchaseOrders.status, filters.status));
  if (filters.supplierId)
    clauses.push(eq(purchaseOrders.supplier_id, filters.supplierId));
  return and(...clauses);
};

const create = async (
  data: NewPurchaseOrder
): Promise<PurchaseOrder | null> => {
  try {
    const [row] = await DB.insert(purchaseOrders).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[PO Repo]: error creating po: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<PurchaseOrder | null> => {
  try {
    const [row] = await DB
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[PO Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const list = async (
  filters: PoFilters
): Promise<{ rows: PurchaseOrder[]; total: number }> => {
  try {
    const where = buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;
    const rows = await DB
      .select()
      .from(purchaseOrders)
      .where(where)
      .orderBy(desc(purchaseOrders.created_at))
      .limit(filters.pageSize)
      .offset(offset);
    const [{ count }] = await DB
      .select({ count: sql<number>`count(*)::int` })
      .from(purchaseOrders)
      .where(where);
    return { rows, total: count ?? 0 };
  } catch (error) {
    logger.error(`[PO Repo]: error listing pos: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewPurchaseOrder>
): Promise<PurchaseOrder | null> => {
  try {
    const [row] = await DB
      .update(purchaseOrders)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[PO Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(purchaseOrders)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(purchaseOrders.id, id), isNull(purchaseOrders.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[PO Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const purchaseOrderRepo: PurchaseOrderRepoType = {
  create,
  findById,
  list,
  update,
  softDelete,
};
