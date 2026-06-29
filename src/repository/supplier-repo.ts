import { and, desc, eq, ilike, isNull, or, sql, SQL } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewSupplier, Supplier, SupplierStatus, suppliers } from "../db/schema";
import { logger } from "../util";

export interface SupplierFilters {
  search?: string; // name / code / email
  status?: SupplierStatus;
  country?: string;
  region?: string;
  category?: string;
  approved?: boolean;
  tier?: number;
  page: number;
  pageSize: number;
}

export type SupplierRepoType = {
  create: (data: NewSupplier) => Promise<Supplier | null>;
  findById: (id: string) => Promise<Supplier | null>;
  findByCode: (code: string) => Promise<Supplier | null>;
  list: (filters: SupplierFilters) => Promise<{ rows: Supplier[]; total: number }>;
  update: (id: string, data: Partial<NewSupplier>) => Promise<Supplier | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const buildWhere = (filters: SupplierFilters): SQL | undefined => {
  const clauses: (SQL | undefined)[] = [isNull(suppliers.deleted_at)];

  if (filters.search) {
    const term = `%${filters.search}%`;
    clauses.push(
      or(
        ilike(suppliers.name, term),
        ilike(suppliers.code, term),
        ilike(suppliers.email, term)
      )
    );
  }
  if (filters.status) clauses.push(eq(suppliers.status, filters.status));
  if (filters.country) clauses.push(eq(suppliers.country, filters.country));
  if (filters.region) clauses.push(eq(suppliers.region, filters.region));
  if (filters.category) clauses.push(eq(suppliers.category, filters.category));
  if (filters.approved !== undefined)
    clauses.push(eq(suppliers.approved, filters.approved));
  if (filters.tier !== undefined) clauses.push(eq(suppliers.tier, filters.tier));

  return and(...clauses);
};

const create = async (data: NewSupplier): Promise<Supplier | null> => {
  try {
    const [row] = await DB.insert(suppliers).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Supplier Repo]: error creating supplier: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<Supplier | null> => {
  try {
    const [row] = await DB
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), isNull(suppliers.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Supplier Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const findByCode = async (code: string): Promise<Supplier | null> => {
  try {
    const [row] = await DB
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.code, code), isNull(suppliers.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Supplier Repo]: error finding by code: ${error}`);
    throw error;
  }
};

const list = async (
  filters: SupplierFilters
): Promise<{ rows: Supplier[]; total: number }> => {
  try {
    const where = buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;

    const rows = await DB
      .select()
      .from(suppliers)
      .where(where)
      .orderBy(desc(suppliers.created_at))
      .limit(filters.pageSize)
      .offset(offset);

    const [{ count }] = await DB
      .select({ count: sql<number>`count(*)::int` })
      .from(suppliers)
      .where(where);

    return { rows, total: count ?? 0 };
  } catch (error) {
    logger.error(`[Supplier Repo]: error listing suppliers: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewSupplier>
): Promise<Supplier | null> => {
  try {
    const [row] = await DB
      .update(suppliers)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(suppliers.id, id), isNull(suppliers.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Supplier Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(suppliers)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(suppliers.id, id), isNull(suppliers.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[Supplier Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const supplierRepo: SupplierRepoType = {
  create,
  findById,
  findByCode,
  list,
  update,
  softDelete,
};
