import { uuidv7 } from "uuidv7";
import { CreateUnitDtoType, UpdateUnitDtoType } from "../api/dto/unit-req-dto";
import { NewUnit } from "../db/schema";
import { UnitRepoType } from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

const create = async (dto: CreateUnitDtoType, repo: UnitRepoType) => {
  const code = dto.code.trim();
  if (await repo.findByCode(code)) {
    throw new ConflictError(`Unit code "${code}" already exists`);
  }

  const created = await repo.create({
    id: uuidv7(),
    code,
    name: dto.name,
    is_active: dto.is_active ?? true,
  } as NewUnit);
  if (!created) throw new ValidationError("Failed to create unit");
  return created;
};

const list = async (repo: UnitRepoType) => repo.list();

const getById = async (id: string, repo: UnitRepoType) => {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError("Unit not found");
  return row;
};

const update = async (id: string, dto: UpdateUnitDtoType, repo: UnitRepoType) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("Unit not found");

  const patch: Partial<NewUnit> = {};
  if (dto.code !== undefined) {
    const code = dto.code.trim();
    if (code !== existing.code) {
      if (await repo.findByCode(code)) {
        throw new ConflictError(`Unit code "${code}" already exists`);
      }
      patch.code = code;
    }
  }
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.is_active !== undefined) patch.is_active = dto.is_active;

  const updated = await repo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update unit");
  return updated;
};

const remove = async (id: string, repo: UnitRepoType) => {
  const ok = await repo.softDelete(id);
  if (!ok) throw new NotFoundError("Unit not found");
  return { message: "Unit deleted successfully" };
};

export const unitService = {
  create,
  list,
  getById,
  update,
  remove,
};
