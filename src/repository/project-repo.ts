import { and, desc, eq, ilike, isNull, or, sql, SQL } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewProject, Project, ProjectStage, projects } from "../db/schema";
import { logger } from "../util";

export interface ProjectFilters {
  search?: string; // number / name / customer
  stage?: ProjectStage;
  customer?: string;
  page: number;
  pageSize: number;
}

export type ProjectRepoType = {
  create: (data: NewProject) => Promise<Project | null>;
  findById: (id: string) => Promise<Project | null>;
  list: (filters: ProjectFilters) => Promise<{ rows: Project[]; total: number }>;
  update: (id: string, data: Partial<NewProject>) => Promise<Project | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const buildWhere = (filters: ProjectFilters): SQL | undefined => {
  const clauses: (SQL | undefined)[] = [isNull(projects.deleted_at)];
  if (filters.search) {
    const term = `%${filters.search}%`;
    clauses.push(
      or(
        ilike(projects.project_number, term),
        ilike(projects.name, term),
        ilike(projects.customer, term)
      )
    );
  }
  if (filters.stage) clauses.push(eq(projects.stage, filters.stage));
  if (filters.customer) clauses.push(eq(projects.customer, filters.customer));
  return and(...clauses);
};

const create = async (data: NewProject): Promise<Project | null> => {
  try {
    const [row] = await DB.insert(projects).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Project Repo]: error creating project: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<Project | null> => {
  try {
    const [row] = await DB
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Project Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const list = async (
  filters: ProjectFilters
): Promise<{ rows: Project[]; total: number }> => {
  try {
    const where = buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;
    const rows = await DB
      .select()
      .from(projects)
      .where(where)
      .orderBy(desc(projects.created_at))
      .limit(filters.pageSize)
      .offset(offset);
    const [{ count }] = await DB
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(where);
    return { rows, total: count ?? 0 };
  } catch (error) {
    logger.error(`[Project Repo]: error listing projects: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewProject>
): Promise<Project | null> => {
  try {
    const [row] = await DB
      .update(projects)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(projects.id, id), isNull(projects.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Project Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(projects)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(projects.id, id), isNull(projects.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[Project Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const projectRepo: ProjectRepoType = {
  create,
  findById,
  list,
  update,
  softDelete,
};
