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
import { alias } from "drizzle-orm/pg-core";
import { DB } from "../db/db-connection";
import { NewProject, Project, ProjectStage, projects, users } from "../db/schema";
import { logger } from "../util";

// Project enriched with the owner's and engineer's display fields, so any role
// viewing the project can see them without the admin-only users list.
export type ProjectWithPeople = Project & {
  owner_name: string | null;
  owner_initials: string | null;
  owner_hue: number | null;
  engineer_name: string | null;
  engineer_initials: string | null;
  engineer_hue: number | null;
  manager_name: string | null;
  manager_initials: string | null;
  manager_hue: number | null;
};

export interface ProjectFilters {
  search?: string; // number / name / customer
  stage?: ProjectStage;
  customer?: string;
  // When set, restrict the list to projects this Project Manager is assigned to.
  managerId?: string;
  page: number;
  pageSize: number;
}

export type ProjectRepoType = {
  create: (data: NewProject) => Promise<Project | null>;
  findById: (id: string) => Promise<ProjectWithPeople | null>;
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
  if (filters.managerId)
    clauses.push(eq(projects.project_manager_id, filters.managerId));
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

const findById = async (id: string): Promise<ProjectWithPeople | null> => {
  try {
    const owner = alias(users, "owner");
    const engineer = alias(users, "engineer");
    const manager = alias(users, "manager");
    const [row] = await DB
      .select({
        ...getTableColumns(projects),
        owner_name: owner.name,
        owner_initials: owner.initials,
        owner_hue: owner.hue,
        engineer_name: engineer.name,
        engineer_initials: engineer.initials,
        engineer_hue: engineer.hue,
        manager_name: manager.name,
        manager_initials: manager.initials,
        manager_hue: manager.hue,
      })
      .from(projects)
      .leftJoin(owner, eq(owner.id, projects.owner_id))
      .leftJoin(engineer, eq(engineer.id, projects.engineer_id))
      .leftJoin(manager, eq(manager.id, projects.project_manager_id))
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
