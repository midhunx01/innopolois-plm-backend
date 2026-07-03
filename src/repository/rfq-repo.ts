import {
  and,
  desc,
  eq,
  getTableColumns,
  ilike,
  isNull,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewRfq, Rfq, RfqStatus, rfqs, users } from "../db/schema";
import { logger } from "../util";

// RFQ enriched with the owner's display fields, so any role viewing the RFQ
// can see the owner without the admin-only users list.
export type RfqWithOwner = Rfq & {
  owner_name: string | null;
  owner_initials: string | null;
  owner_hue: number | null;
};

export interface RfqFilters {
  search?: string; // number / title
  status?: RfqStatus;
  projectId?: string;
  page: number;
  pageSize: number;
}

export type RfqRepoType = {
  create: (data: NewRfq) => Promise<Rfq | null>;
  findById: (id: string) => Promise<RfqWithOwner | null>;
  list: (filters: RfqFilters) => Promise<{ rows: Rfq[]; total: number }>;
  update: (id: string, data: Partial<NewRfq>) => Promise<Rfq | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const buildWhere = (filters: RfqFilters): SQL | undefined => {
  const clauses: (SQL | undefined)[] = [isNull(rfqs.deleted_at)];
  if (filters.search) {
    const term = `%${filters.search}%`;
    clauses.push(or(ilike(rfqs.number, term), ilike(rfqs.title, term)));
  }
  if (filters.status) clauses.push(eq(rfqs.status, filters.status));
  if (filters.projectId) clauses.push(eq(rfqs.project_id, filters.projectId));
  return and(...clauses);
};

const create = async (data: NewRfq): Promise<Rfq | null> => {
  try {
    const [row] = await DB.insert(rfqs).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Rfq Repo]: error creating rfq: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<RfqWithOwner | null> => {
  try {
    const [row] = await DB
      .select({
        ...getTableColumns(rfqs),
        owner_name: users.name,
        owner_initials: users.initials,
        owner_hue: users.hue,
      })
      .from(rfqs)
      .leftJoin(users, eq(users.id, rfqs.owner_id))
      .where(and(eq(rfqs.id, id), isNull(rfqs.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Rfq Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const list = async (
  filters: RfqFilters
): Promise<{ rows: Rfq[]; total: number }> => {
  try {
    const where = buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;
    const rows = await DB
      .select()
      .from(rfqs)
      .where(where)
      .orderBy(desc(rfqs.created_at))
      .limit(filters.pageSize)
      .offset(offset);
    const [{ count }] = await DB
      .select({ count: sql<number>`count(*)::int` })
      .from(rfqs)
      .where(where);
    return { rows, total: count ?? 0 };
  } catch (error) {
    logger.error(`[Rfq Repo]: error listing rfqs: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewRfq>
): Promise<Rfq | null> => {
  try {
    const [row] = await DB
      .update(rfqs)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(rfqs.id, id), isNull(rfqs.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Rfq Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(rfqs)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(rfqs.id, id), isNull(rfqs.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[Rfq Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const rfqRepo: RfqRepoType = {
  create,
  findById,
  list,
  update,
  softDelete,
};
