import { uuidv7 } from "uuidv7";
import {
  CreateSubtypeDtoType,
  UpdateSubtypeDtoType,
} from "../api/dto/subtype-req-dto";
import { NewSubtype } from "../db/schema";
import { MaterialCategoryRepoType, SubtypeRepoType } from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

const normalizeCode = (code: string) => code.trim().toUpperCase();

const create = async (
  dto: CreateSubtypeDtoType,
  subtypeRepo: SubtypeRepoType,
  categoryRepo: MaterialCategoryRepoType
) => {
  const category = await categoryRepo.findById(dto.category_id);
  if (!category) throw new ValidationError("category_id does not exist");

  const code = normalizeCode(dto.code);
  if (await subtypeRepo.findByCategoryAndCode(dto.category_id, code)) {
    throw new ConflictError(
      `Subtype code "${code}" already exists in this category`
    );
  }

  const newSubtype: NewSubtype = {
    id: uuidv7(),
    category_id: dto.category_id,
    name: dto.name,
    code,
    is_active: dto.is_active ?? true,
  };

  const created = await subtypeRepo.create(newSubtype);
  if (!created) throw new ValidationError("Failed to create subtype");
  return created;
};

const listByCategory = async (
  categoryId: string,
  subtypeRepo: SubtypeRepoType,
  categoryRepo: MaterialCategoryRepoType
) => {
  const category = await categoryRepo.findById(categoryId);
  if (!category) throw new NotFoundError("Category not found");
  return subtypeRepo.listByCategory(categoryId);
};

const getById = async (id: string, subtypeRepo: SubtypeRepoType) => {
  const subtype = await subtypeRepo.findById(id);
  if (!subtype) throw new NotFoundError("Subtype not found");
  return subtype;
};

const update = async (
  id: string,
  dto: UpdateSubtypeDtoType,
  subtypeRepo: SubtypeRepoType
) => {
  const existing = await subtypeRepo.findById(id);
  if (!existing) throw new NotFoundError("Subtype not found");

  const patch: Partial<NewSubtype> = {};

  if (dto.code !== undefined) {
    const code = normalizeCode(dto.code);
    if (code !== existing.code) {
      if (await subtypeRepo.findByCategoryAndCode(existing.category_id, code)) {
        throw new ConflictError(
          `Subtype code "${code}" already exists in this category`
        );
      }
      patch.code = code;
    }
  }
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.is_active !== undefined) patch.is_active = dto.is_active;

  const updated = await subtypeRepo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update subtype");
  return updated;
};

const remove = async (id: string, subtypeRepo: SubtypeRepoType) => {
  const ok = await subtypeRepo.softDelete(id);
  if (!ok) throw new NotFoundError("Subtype not found");
  return { message: "Subtype deleted successfully" };
};

export const subtypeService = {
  create,
  listByCategory,
  getById,
  update,
  remove,
};
