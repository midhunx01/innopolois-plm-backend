import { and, desc, eq, getTableColumns, sql, SQL } from "drizzle-orm";
import { DB } from "../db/db-connection";
import {
  NewStockMovement,
  StockMovement,
  StockMovementType,
  stockMovements,
  users,
} from "../db/schema";
import { logger } from "../util";

export interface MovementFilters {
  partId?: string;
  warehouseId?: string;
  type?: StockMovementType;
  page: number;
  pageSize: number;
}

// Movement enriched with the acting user's display fields so any role viewing
// the stock ledger can see who performed each movement — without the
// admin-only users list to resolve user_id → name.
export type StockMovementWithActor = StockMovement & {
  user_name: string | null;
  user_initials: string | null;
  user_hue: number | null;
};

export type StockMovementRepoType = {
  create: (data: NewStockMovement) => Promise<StockMovement | null>;
  list: (
    filters: MovementFilters
  ) => Promise<{ rows: StockMovementWithActor[]; total: number }>;
};

const buildWhere = (filters: MovementFilters): SQL | undefined => {
  const clauses: (SQL | undefined)[] = [];
  if (filters.partId) clauses.push(eq(stockMovements.part_id, filters.partId));
  if (filters.warehouseId)
    clauses.push(eq(stockMovements.warehouse_id, filters.warehouseId));
  if (filters.type) clauses.push(eq(stockMovements.type, filters.type));
  return clauses.length ? and(...clauses) : undefined;
};

const create = async (
  data: NewStockMovement
): Promise<StockMovement | null> => {
  try {
    const [row] = await DB.insert(stockMovements).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[StockMovement Repo]: error creating: ${error}`);
    throw error;
  }
};

const list = async (
  filters: MovementFilters
): Promise<{ rows: StockMovementWithActor[]; total: number }> => {
  try {
    const where = buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;
    const rows = await DB
      .select({
        ...getTableColumns(stockMovements),
        user_name: users.name,
        user_initials: users.initials,
        user_hue: users.hue,
      })
      .from(stockMovements)
      .leftJoin(users, eq(users.id, stockMovements.user_id))
      .where(where)
      .orderBy(desc(stockMovements.created_at))
      .limit(filters.pageSize)
      .offset(offset);
    const [{ count }] = await DB
      .select({ count: sql<number>`count(*)::int` })
      .from(stockMovements)
      .where(where);
    return { rows, total: count ?? 0 };
  } catch (error) {
    logger.error(`[StockMovement Repo]: error listing: ${error}`);
    throw error;
  }
};

export const stockMovementRepo: StockMovementRepoType = { create, list };
