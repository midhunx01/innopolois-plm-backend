import { uuidv7 } from "uuidv7";
import {
  CreateProjectDtoType,
  UpdateProjectDtoType,
} from "../api/dto/project-req-dto";
import { NewProject, ProjectStage, Role } from "../db/schema";
import {
  CounterRepoType,
  ProjectFilters,
  ProjectRepoType,
} from "../repository";
import { AuthorizeError, NotFoundError, ValidationError } from "../util/error";

export type Viewer = { id: string; role: Role };

// A Project Manager may only see/act on the projects they are assigned to.
const isForeignToManager = (
  project: { project_manager_id: string | null },
  viewer?: Viewer
): boolean =>
  viewer?.role === "Project Manager" &&
  project.project_manager_id !== viewer.id;

export interface ProjectServiceDeps {
  projectRepo: ProjectRepoType;
  counterRepo: CounterRepoType;
}

const num = (v: number | undefined): string | undefined =>
  v === undefined ? undefined : v.toString();

const create = async (
  dto: CreateProjectDtoType,
  ownerId: string,
  deps: ProjectServiceDeps
) => {
  const year = new Date().getFullYear();
  const seq = await deps.counterRepo.next(`project:${year}`);
  const projectNumber = `INP-${year}-${String(seq).padStart(4, "0")}`;

  const newProject: NewProject = {
    id: uuidv7(),
    project_number: projectNumber,
    name: dto.name,
    customer: dto.customer ?? "",
    family: dto.family ?? "",
    category: dto.category ?? "",
    description: dto.description ?? "",
    engineer_id: dto.engineer_id ?? ownerId,
    owner_id: ownerId,
    project_manager_id: dto.project_manager_id ?? null,
    stage: dto.stage ?? "Enquiry",
    lifecycle: dto.lifecycle ?? "Concept",
    revision: dto.revision ?? "A",
    version: dto.version ?? "1.0",
    target_cost: num(dto.target_cost) ?? "0",
    quoted_price: num(dto.quoted_price) ?? "0",
    thumbnail_hue: dto.thumbnail_hue ?? 210,
    enquiry_date: new Date(),
  };

  const created = await deps.projectRepo.create(newProject);
  if (!created) throw new ValidationError("Failed to create project");
  return created;
};

const list = async (filters: ProjectFilters, projectRepo: ProjectRepoType) =>
  projectRepo.list(filters);

const getById = async (
  id: string,
  projectRepo: ProjectRepoType,
  viewer?: Viewer
) => {
  const project = await projectRepo.findById(id);
  // Hide (not 403) projects a Project Manager isn't assigned to.
  if (!project || isForeignToManager(project, viewer)) {
    throw new NotFoundError("Project not found");
  }
  return project;
};

// Coordinate the project by moving its lifecycle stage (FRD §1). A Project
// Manager may only advance their own projects; Engineering/Admin any.
const updateStage = async (
  id: string,
  stage: ProjectStage,
  viewer: Viewer,
  projectRepo: ProjectRepoType
) => {
  const project = await projectRepo.findById(id);
  if (!project) throw new NotFoundError("Project not found");
  if (isForeignToManager(project, viewer)) {
    throw new AuthorizeError("You are not the Project Manager for this project");
  }
  const updated = await projectRepo.update(id, { stage });
  if (!updated) throw new ValidationError("Failed to update project stage");
  return updated;
};

const update = async (
  id: string,
  dto: UpdateProjectDtoType,
  projectRepo: ProjectRepoType
) => {
  const existing = await projectRepo.findById(id);
  if (!existing) throw new NotFoundError("Project not found");

  const patch: Partial<NewProject> = {};
  const numericKeys = ["target_cost", "quoted_price"] as const;
  for (const [key, value] of Object.entries(dto)) {
    if (value === undefined) continue;
    if ((numericKeys as readonly string[]).includes(key)) {
      (patch as any)[key] = (value as number).toString();
    } else {
      (patch as any)[key] = value;
    }
  }

  const updated = await projectRepo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update project");
  return updated;
};

const remove = async (id: string, projectRepo: ProjectRepoType) => {
  const ok = await projectRepo.softDelete(id);
  if (!ok) throw new NotFoundError("Project not found");
  return { message: "Project deleted successfully" };
};

export const projectService = {
  create,
  list,
  getById,
  updateStage,
  update,
  remove,
};
