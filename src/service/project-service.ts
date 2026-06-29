import { uuidv7 } from "uuidv7";
import {
  CreateProjectDtoType,
  UpdateProjectDtoType,
} from "../api/dto/project-req-dto";
import { NewProject } from "../db/schema";
import {
  CounterRepoType,
  ProjectFilters,
  ProjectRepoType,
} from "../repository";
import { NotFoundError, ValidationError } from "../util/error";

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

const getById = async (id: string, projectRepo: ProjectRepoType) => {
  const project = await projectRepo.findById(id);
  if (!project) throw new NotFoundError("Project not found");
  return project;
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
  update,
  remove,
};
