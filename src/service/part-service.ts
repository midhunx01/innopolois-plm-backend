import { uuidv7 } from "uuidv7";
import { CreatePartDtoType, UpdatePartDtoType } from "../api/dto/part-req-dto";
import { NewPart } from "../db/schema";
import {
  GradeRepoType,
  MajorSpecRepoType,
  MaterialCategoryRepoType,
  PartFilters,
  PartRepoType,
  SubtypeRepoType,
} from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";
import { buildMaterialCode } from "../util/helper/material-code";

export interface PartServiceDeps {
  partRepo: PartRepoType;
  categoryRepo: MaterialCategoryRepoType;
  subtypeRepo: SubtypeRepoType;
  majorSpecRepo: MajorSpecRepoType;
  gradeRepo: GradeRepoType;
}

const num = (v: number | undefined, fallback = "0"): string =>
  v === undefined ? fallback : v.toString();

const create = async (
  dto: CreatePartDtoType,
  ownerId: string,
  deps: PartServiceDeps
) => {
  // 1. Resolve the code-composition masters.
  const category = await deps.categoryRepo.findById(dto.category_id);
  if (!category) throw new ValidationError("category_id does not exist");

  const subtype = await deps.subtypeRepo.findById(dto.subtype_id);
  if (!subtype) throw new ValidationError("subtype_id does not exist");
  if (subtype.category_id !== category.id) {
    throw new ValidationError("subtype does not belong to the selected category");
  }

  let majorSpecCode = "00";
  if (dto.major_spec_id) {
    const ms = await deps.majorSpecRepo.findById(dto.major_spec_id);
    if (!ms) throw new ValidationError("major_spec_id does not exist");
    majorSpecCode = ms.code;
  }

  let detailSpecCode = "0000";
  if (dto.grade_id) {
    const g = await deps.gradeRepo.findById(dto.grade_id);
    if (!g) throw new ValidationError("grade_id does not exist");
    detailSpecCode = g.code;
  }

  // 2. Build the intelligent material code TT-SS-MM-DDDD (FRD §4).
  const partNumber = buildMaterialCode(
    category.type_code,
    subtype.code,
    majorSpecCode,
    detailSpecCode
  );

  if (await deps.partRepo.findByPartNumber(partNumber)) {
    throw new ConflictError(
      `A material with code "${partNumber}" already exists. ` +
        "Refine the major/detailed specification to make it unique."
    );
  }

  // 3. Assemble the row (denormalising code segments + display names).
  const newPart: NewPart = {
    id: uuidv7(),
    part_number: partNumber,
    category_id: category.id,
    subtype_id: subtype.id,
    major_spec_id: dto.major_spec_id ?? null,
    grade_id: dto.grade_id ?? null,

    material_type: category.type_code,
    sub_type: subtype.name,
    sub_type_code: subtype.code,
    major_spec: majorSpecCode,
    detail_spec: detailSpecCode,
    category: category.name,

    name: dto.name,
    description: dto.description ?? "",
    material: dto.material ?? "",
    finish: dto.finish ?? "",
    revision: dto.revision ?? "A",
    lifecycle: dto.lifecycle ?? "Concept",
    sourcing: dto.sourcing ?? "Buy",
    weight_kg: num(dto.weight_kg),

    unit_cost: num(dto.unit_cost),
    last_purchase_price: num(dto.last_purchase_price),
    lead_time_days: dto.lead_time_days ?? 0,
    supplier_id: dto.supplier_id ?? null,
    manufacturer_part_number: dto.manufacturer_part_number ?? "",
    make: dto.make ?? "",
    model: dto.model ?? "",
    drawing_ref: dto.drawing_ref ?? "",

    availability: dto.availability ?? "Out of Stock",
    stock_qty: num(dto.stock_qty),
    reorder_point: num(dto.reorder_point),
    min_stock: num(dto.min_stock),
    max_stock: num(dto.max_stock),
    stock_location: dto.stock_location ?? "",
    uom: dto.uom ?? category.default_uom,

    compliance: dto.compliance ?? [],
    tags: dto.tags ?? [],
    owner_id: ownerId,
    thumbnail_hue: dto.thumbnail_hue ?? 210,
  };

  const created = await deps.partRepo.create(newPart);
  if (!created) throw new ValidationError("Failed to create material");
  return created;
};

const list = async (filters: PartFilters, partRepo: PartRepoType) =>
  partRepo.list(filters);

const getById = async (id: string, partRepo: PartRepoType) => {
  const part = await partRepo.findById(id);
  if (!part) throw new NotFoundError("Material not found");
  return part;
};

const update = async (
  id: string,
  dto: UpdatePartDtoType,
  partRepo: PartRepoType
) => {
  const existing = await partRepo.findById(id);
  if (!existing) throw new NotFoundError("Material not found");

  // Code-composition fields are immutable (enforced by the DTO). Everything
  // else is a straight patch; numeric fields are stringified for Drizzle.
  const patch: Partial<NewPart> = {};
  const numericKeys = [
    "weight_kg",
    "unit_cost",
    "last_purchase_price",
    "stock_qty",
    "reorder_point",
    "min_stock",
    "max_stock",
  ] as const;

  for (const [key, value] of Object.entries(dto)) {
    if (value === undefined) continue;
    if ((numericKeys as readonly string[]).includes(key)) {
      (patch as any)[key] = (value as number).toString();
    } else {
      (patch as any)[key] = value;
    }
  }

  const updated = await partRepo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update material");
  return updated;
};

const remove = async (id: string, partRepo: PartRepoType) => {
  const ok = await partRepo.softDelete(id);
  if (!ok) throw new NotFoundError("Material not found");
  return { message: "Material deleted successfully" };
};

export const partService = {
  create,
  list,
  getById,
  update,
  remove,
};
