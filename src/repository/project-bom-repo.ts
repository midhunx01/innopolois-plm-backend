import {
  and,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNull,
  sql,
  SQL,
} from "drizzle-orm";
import { DB } from "../db/db-connection";
import {
  BomStage,
  NewProjectBom,
  ProjectBom,
  projectBoms,
  projects,
  users,
} from "../db/schema";
import { logger } from "../util";

// BOM enriched with the owner's display fields, so any role viewing the BOM
// can see the owner without the admin-only users list.
export type ProjectBomWithOwner = ProjectBom & {
  owner_name: string | null;
  owner_initials: string | null;
  owner_hue: number | null;
};

export interface ProjectBomFilters {
  projectId?: string;
  stage?: BomStage;
  // When set, restrict to BOMs whose project this Project Manager is assigned to.
  managerId?: string;
  page: number;
  pageSize: number;
}

export type ProjectBomRepoType = {
  create: (data: NewProjectBom) => Promise<ProjectBom | null>;
  findById: (id: string) => Promise<ProjectBomWithOwner | null>;
  list: (
    filters: ProjectBomFilters
  ) => Promise<{ rows: ProjectBom[]; total: number }>;
  listByProject: (projectId: string) => Promise<ProjectBom[]>;
  update: (
    id: string,
    data: Partial<NewProjectBom>
  ) => Promise<ProjectBom | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const buildWhere = (filters: ProjectBomFilters): SQL | undefined => {
  const clauses: (SQL | undefined)[] = [isNull(projectBoms.deleted_at)];
  if (filters.projectId)
    clauses.push(eq(projectBoms.project_id, filters.projectId));
  if (filters.stage) clauses.push(eq(projectBoms.stage, filters.stage));
  if (filters.managerId)
    clauses.push(
      inArray(
        projectBoms.project_id,
        DB.select({ id: projects.id })
          .from(projects)
          .where(eq(projects.project_manager_id, filters.managerId))
      )
    );
  return and(...clauses);
};

const create = async (data: NewProjectBom): Promise<ProjectBom | null> => {
  try {
    const [row] = await DB.insert(projectBoms).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[ProjectBom Repo]: error creating bom: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<ProjectBomWithOwner | null> => {
  try {
    const [row] = await DB
      .select({
        ...getTableColumns(projectBoms),
        owner_name: users.name,
        owner_initials: users.initials,
        owner_hue: users.hue,
      })
      .from(projectBoms)
      .leftJoin(users, eq(users.id, projectBoms.owner_id))
      .where(and(eq(projectBoms.id, id), isNull(projectBoms.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[ProjectBom Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const list = async (
  filters: ProjectBomFilters
): Promise<{ rows: ProjectBom[]; total: number }> => {
  try {
    const where = buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;
    const rows = await DB
      .select()
      .from(projectBoms)
      .where(where)
      .orderBy(desc(projectBoms.created_at))
      .limit(filters.pageSize)
      .offset(offset);
    const [{ count }] = await DB
      .select({ count: sql<number>`count(*)::int` })
      .from(projectBoms)
      .where(where);
    return { rows, total: count ?? 0 };
  } catch (error) {
    logger.error(`[ProjectBom Repo]: error listing boms: ${error}`);
    throw error;
  }
};

const listByProject = async (projectId: string): Promise<ProjectBom[]> => {
  try {
    return await DB
      .select()
      .from(projectBoms)
      .where(
        and(
          eq(projectBoms.project_id, projectId),
          isNull(projectBoms.deleted_at)
        )
      )
      .orderBy(desc(projectBoms.created_at));
  } catch (error) {
    logger.error(`[ProjectBom Repo]: error listing by project: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewProjectBom>
): Promise<ProjectBom | null> => {
  try {
    const [row] = await DB
      .update(projectBoms)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(projectBoms.id, id), isNull(projectBoms.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[ProjectBom Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(projectBoms)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(projectBoms.id, id), isNull(projectBoms.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[ProjectBom Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const projectBomRepo: ProjectBomRepoType = {
  create,
  findById,
  list,
  listByProject,
  update,
  softDelete,
};
