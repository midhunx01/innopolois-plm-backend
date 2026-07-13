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
import { DB, DbClient } from "../db/db-connection";
import {
  Availability,
  Lifecycle,
  NewPart,
  Part,
  SourcingType,
  parts,
  users,
} from "../db/schema";
import { logger } from "../util";

// Part enriched with the owner's display fields, so any role viewing the part
// can see the owner without the admin-only users list.
export type PartWithOwner = Part & {
  owner_name: string | null;
  owner_initials: string | null;
  owner_hue: number | null;
};

export interface PartFilters {
  search?: string; // code / name / remarks / drawing / make
  categoryId?: string;
  subtypeId?: string;
  lifecycle?: Lifecycle;
  availability?: Availability;
  sourcing?: SourcingType;
  page: number;
  pageSize: number;
}

export type PartRepoType = {
  create: (data: NewPart) => Promise<Part | null>;
  findById: (id: string) => Promise<PartWithOwner | null>;
  findByPartNumber: (partNumber: string) => Promise<Part | null>;
  list: (filters: PartFilters) => Promise<{ rows: Part[]; total: number }>;
  update: (
    id: string,
    data: Partial<NewPart>,
    db?: DbClient
  ) => Promise<Part | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const buildWhere = (filters: PartFilters): SQL | undefined => {
  const clauses: (SQL | undefined)[] = [isNull(parts.deleted_at)];

  if (filters.search) {
    const term = `%${filters.search}%`;
    clauses.push(
      or(
        ilike(parts.part_number, term),
        ilike(parts.name, term),
        ilike(parts.remarks, term),
        ilike(parts.drawing_ref, term),
        ilike(parts.make, term)
      )
    );
  }
  if (filters.categoryId) clauses.push(eq(parts.category_id, filters.categoryId));
  if (filters.subtypeId) clauses.push(eq(parts.subtype_id, filters.subtypeId));
  if (filters.lifecycle) clauses.push(eq(parts.lifecycle, filters.lifecycle));
  if (filters.availability)
    clauses.push(eq(parts.availability, filters.availability));
  if (filters.sourcing) clauses.push(eq(parts.sourcing, filters.sourcing));

  return and(...clauses);
};

const create = async (data: NewPart): Promise<Part | null> => {
  try {
    const [row] = await DB.insert(parts).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Part Repo]: error creating part: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<PartWithOwner | null> => {
  try {
    const [row] = await DB
      .select({
        ...getTableColumns(parts),
        owner_name: users.name,
        owner_initials: users.initials,
        owner_hue: users.hue,
      })
      .from(parts)
      .leftJoin(users, eq(users.id, parts.owner_id))
      .where(and(eq(parts.id, id), isNull(parts.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Part Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const findByPartNumber = async (partNumber: string): Promise<Part | null> => {
  try {
    const [row] = await DB
      .select()
      .from(parts)
      .where(and(eq(parts.part_number, partNumber), isNull(parts.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Part Repo]: error finding by part_number: ${error}`);
    throw error;
  }
};

const list = async (
  filters: PartFilters
): Promise<{ rows: Part[]; total: number }> => {
  try {
    const where = buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;

    const rows = await DB
      .select()
      .from(parts)
      .where(where)
      .orderBy(desc(parts.created_at))
      .limit(filters.pageSize)
      .offset(offset);

    const [{ count }] = await DB
      .select({ count: sql<number>`count(*)::int` })
      .from(parts)
      .where(where);

    return { rows, total: count ?? 0 };
  } catch (error) {
    logger.error(`[Part Repo]: error listing parts: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewPart>,
  db: DbClient = DB
): Promise<Part | null> => {
  try {
    const [row] = await db
      .update(parts)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(parts.id, id), isNull(parts.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Part Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(parts)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(parts.id, id), isNull(parts.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[Part Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const partRepo: PartRepoType = {
  create,
  findById,
  findByPartNumber,
  list,
  update,
  softDelete,
};
