import { uuidv7 } from "uuidv7";
import {
  CreateGradeDtoType,
  UpdateGradeDtoType,
} from "../api/dto/grade-req-dto";
import { NewGrade } from "../db/schema";
import { GradeRepoType } from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

const normalizeCode = (code: string) => code.trim().toUpperCase();

const create = async (dto: CreateGradeDtoType, repo: GradeRepoType) => {
  const code = normalizeCode(dto.code);
  if (await repo.findByCode(code)) {
    throw new ConflictError(`Grade code "${code}" already exists`);
  }

  const created = await repo.create({
    id: uuidv7(),
    code,
    label: dto.label,
    is_active: dto.is_active ?? true,
  } as NewGrade);
  if (!created) throw new ValidationError("Failed to create grade");
  return created;
};

const list = async (repo: GradeRepoType) => repo.list();

const getById = async (id: string, repo: GradeRepoType) => {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError("Grade not found");
  return row;
};

const update = async (
  id: string,
  dto: UpdateGradeDtoType,
  repo: GradeRepoType
) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("Grade not found");

  const patch: Partial<NewGrade> = {};
  if (dto.code !== undefined) {
    const code = normalizeCode(dto.code);
    if (code !== existing.code) {
      if (await repo.findByCode(code)) {
        throw new ConflictError(`Grade code "${code}" already exists`);
      }
      patch.code = code;
    }
  }
  if (dto.label !== undefined) patch.label = dto.label;
  if (dto.is_active !== undefined) patch.is_active = dto.is_active;

  const updated = await repo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update grade");
  return updated;
};

const remove = async (id: string, repo: GradeRepoType) => {
  const ok = await repo.softDelete(id);
  if (!ok) throw new NotFoundError("Grade not found");
  return { message: "Grade deleted successfully" };
};

export const gradeService = {
  create,
  list,
  getById,
  update,
  remove,
};
