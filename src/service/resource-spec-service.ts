import { uuidv7 } from "uuidv7";
import {
  CreateResourceSpecDtoType,
  UpdateResourceSpecDtoType,
} from "../api/dto/resource-spec-req-dto";
import { NewResourceSpec } from "../db/schema";
import { ResourceSpecRepoType } from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

const create = async (
  dto: CreateResourceSpecDtoType,
  repo: ResourceSpecRepoType
) => {
  const code = dto.code.trim();
  if (await repo.findByCode(code)) {
    throw new ConflictError(`Resource spec code "${code}" already exists`);
  }

  const created = await repo.create({
    id: uuidv7(),
    code,
    name: dto.name,
    description: dto.description ?? "",
    is_active: dto.is_active ?? true,
  } as NewResourceSpec);
  if (!created) throw new ValidationError("Failed to create resource spec");
  return created;
};

const list = async (repo: ResourceSpecRepoType) => repo.list();

const getById = async (id: string, repo: ResourceSpecRepoType) => {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError("Resource spec not found");
  return row;
};

const update = async (
  id: string,
  dto: UpdateResourceSpecDtoType,
  repo: ResourceSpecRepoType
) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("Resource spec not found");

  const patch: Partial<NewResourceSpec> = {};
  if (dto.code !== undefined) {
    const code = dto.code.trim();
    if (code !== existing.code) {
      if (await repo.findByCode(code)) {
        throw new ConflictError(`Resource spec code "${code}" already exists`);
      }
      patch.code = code;
    }
  }
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.description !== undefined) patch.description = dto.description;
  if (dto.is_active !== undefined) patch.is_active = dto.is_active;

  const updated = await repo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update resource spec");
  return updated;
};

const remove = async (id: string, repo: ResourceSpecRepoType) => {
  const ok = await repo.softDelete(id);
  if (!ok) throw new NotFoundError("Resource spec not found");
  return { message: "Resource spec deleted successfully" };
};

export const resourceSpecService = {
  create,
  list,
  getById,
  update,
  remove,
};
