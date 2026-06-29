import { uuidv7 } from "uuidv7";
import {
  CreateMajorSpecDtoType,
  UpdateMajorSpecDtoType,
} from "../api/dto/major-spec-req-dto";
import { NewMajorSpec } from "../db/schema";
import { MajorSpecRepoType } from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

const normalizeCode = (code: string) => code.trim().toUpperCase();

const create = async (dto: CreateMajorSpecDtoType, repo: MajorSpecRepoType) => {
  const code = normalizeCode(dto.code);
  if (await repo.findByCode(code)) {
    throw new ConflictError(`Major spec code "${code}" already exists`);
  }

  const created = await repo.create({
    id: uuidv7(),
    code,
    label: dto.label,
    is_active: dto.is_active ?? true,
  } as NewMajorSpec);
  if (!created) throw new ValidationError("Failed to create major spec");
  return created;
};

const list = async (repo: MajorSpecRepoType) => repo.list();

const getById = async (id: string, repo: MajorSpecRepoType) => {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError("Major spec not found");
  return row;
};

const update = async (
  id: string,
  dto: UpdateMajorSpecDtoType,
  repo: MajorSpecRepoType
) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("Major spec not found");

  const patch: Partial<NewMajorSpec> = {};
  if (dto.code !== undefined) {
    const code = normalizeCode(dto.code);
    if (code !== existing.code) {
      if (await repo.findByCode(code)) {
        throw new ConflictError(`Major spec code "${code}" already exists`);
      }
      patch.code = code;
    }
  }
  if (dto.label !== undefined) patch.label = dto.label;
  if (dto.is_active !== undefined) patch.is_active = dto.is_active;

  const updated = await repo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update major spec");
  return updated;
};

const remove = async (id: string, repo: MajorSpecRepoType) => {
  const ok = await repo.softDelete(id);
  if (!ok) throw new NotFoundError("Major spec not found");
  return { message: "Major spec deleted successfully" };
};

export const majorSpecService = {
  create,
  list,
  getById,
  update,
  remove,
};
