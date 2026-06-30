import { and, desc, eq, ilike, isNull, or, sql, SQL } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewUser, Role, User, users } from "../db/schema";
import { logger } from "../util";

export interface UserFilters {
  search?: string; // name / email
  role?: Role;
  page: number;
  pageSize: number;
}

export type UserRepoType = {
  create: (data: NewUser) => Promise<User | null>;
  findById: (id: string) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
  list: () => Promise<User[]>;
  listPaged: (filters: UserFilters) => Promise<{ rows: User[]; total: number }>;
  update: (id: string, data: Partial<NewUser>) => Promise<User | null>;
  softDelete: (id: string) => Promise<boolean>;
  countActiveByRole: (role: Role) => Promise<number>;
};

const create = async (data: NewUser): Promise<User | null> => {
  try {
    const [row] = await DB.insert(users).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[User Repo]: error creating user: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<User | null> => {
  try {
    const [row] = await DB
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[User Repo]: error finding user ${id}: ${error}`);
    throw error;
  }
};

const findByEmail = async (email: string): Promise<User | null> => {
  try {
    const [row] = await DB
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[User Repo]: error finding user by email: ${error}`);
    throw error;
  }
};

const list = async (): Promise<User[]> => {
  try {
    return await DB
      .select()
      .from(users)
      .where(isNull(users.deleted_at))
      .orderBy(desc(users.created_at));
  } catch (error) {
    logger.error(`[User Repo]: error listing users: ${error}`);
    throw error;
  }
};

const listPaged = async (
  filters: UserFilters
): Promise<{ rows: User[]; total: number }> => {
  try {
    const clauses: (SQL | undefined)[] = [isNull(users.deleted_at)];
    if (filters.search) {
      const term = `%${filters.search}%`;
      clauses.push(or(ilike(users.name, term), ilike(users.email, term)));
    }
    if (filters.role) clauses.push(eq(users.role, filters.role));
    const where = and(...clauses);
    const offset = (filters.page - 1) * filters.pageSize;

    const rows = await DB
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.created_at))
      .limit(filters.pageSize)
      .offset(offset);
    const [{ count }] = await DB
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(where);
    return { rows, total: count ?? 0 };
  } catch (error) {
    logger.error(`[User Repo]: error listing users: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewUser>
): Promise<User | null> => {
  try {
    const [row] = await DB
      .update(users)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(users.id, id), isNull(users.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[User Repo]: error updating user ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(users)
      .set({ deleted_at: new Date(), is_active: false, updated_at: new Date() })
      .where(and(eq(users.id, id), isNull(users.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[User Repo]: error deleting user ${id}: ${error}`);
    throw error;
  }
};

const countActiveByRole = async (role: Role): Promise<number> => {
  try {
    const [{ count }] = await DB
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.role, role),
          eq(users.is_active, true),
          isNull(users.deleted_at)
        )
      );
    return count ?? 0;
  } catch (error) {
    logger.error(`[User Repo]: error counting role ${role}: ${error}`);
    throw error;
  }
};

export const userRepo: UserRepoType = {
  create,
  findById,
  findByEmail,
  list,
  listPaged,
  update,
  softDelete,
  countActiveByRole,
};
