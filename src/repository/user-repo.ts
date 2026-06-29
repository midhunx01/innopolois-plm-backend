import { and, desc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewUser, User, users } from "../db/schema";
import { logger } from "../util";

export type UserRepoType = {
  create: (data: NewUser) => Promise<User | null>;
  findById: (id: string) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
  list: () => Promise<User[]>;
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

export const userRepo: UserRepoType = {
  create,
  findById,
  findByEmail,
  list,
};
