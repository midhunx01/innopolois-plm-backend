import { uuidv7 } from "uuidv7";
import {
  CreateMaterialCategoryDtoType,
  UpdateMaterialCategoryDtoType,
} from "../api/dto/material-category-req-dto";
import { NewMaterialCategory } from "../db/schema";
import { MaterialCategoryRepoType } from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

const normalizeCode = (code: string) => code.trim().toUpperCase();

const create = async (
  dto: CreateMaterialCategoryDtoType,
  repo: MaterialCategoryRepoType
) => {
  const typeCode = normalizeCode(dto.type_code);

  if (await repo.findByTypeCode(typeCode)) {
    throw new ConflictError(`A category with type code "${typeCode}" already exists`);
  }
  if (await repo.findByName(dto.name)) {
    throw new ConflictError(`A category named "${dto.name}" already exists`);
  }

  const newCategory: NewMaterialCategory = {
    id: uuidv7(),
    name: dto.name,
    type_code: typeCode,
    default_uom: dto.default_uom ?? "Nos",
    is_active: dto.is_active ?? true,
  };

  const created = await repo.create(newCategory);
  if (!created) throw new ValidationError("Failed to create category");
  return created;
};

const list = async (repo: MaterialCategoryRepoType) => repo.list();

const getById = async (id: string, repo: MaterialCategoryRepoType) => {
  const category = await repo.findById(id);
  if (!category) throw new NotFoundError("Category not found");
  return category;
};

const update = async (
  id: string,
  dto: UpdateMaterialCategoryDtoType,
  repo: MaterialCategoryRepoType
) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("Category not found");

  const patch: Partial<NewMaterialCategory> = {};

  if (dto.type_code !== undefined) {
    const typeCode = normalizeCode(dto.type_code);
    if (typeCode !== existing.type_code) {
      if (await repo.findByTypeCode(typeCode)) {
        throw new ConflictError(`A category with type code "${typeCode}" already exists`);
      }
      patch.type_code = typeCode;
    }
  }
  if (dto.name !== undefined && dto.name !== existing.name) {
    if (await repo.findByName(dto.name)) {
      throw new ConflictError(`A category named "${dto.name}" already exists`);
    }
    patch.name = dto.name;
  }
  if (dto.default_uom !== undefined) patch.default_uom = dto.default_uom;
  if (dto.is_active !== undefined) patch.is_active = dto.is_active;

  const updated = await repo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update category");
  return updated;
};

const remove = async (id: string, repo: MaterialCategoryRepoType) => {
  const ok = await repo.softDelete(id);
  if (!ok) throw new NotFoundError("Category not found");
  return { message: "Category deleted successfully" };
};

export const materialCategoryService = {
  create,
  list,
  getById,
  update,
  remove,
};
