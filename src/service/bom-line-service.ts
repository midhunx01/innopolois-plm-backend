import { uuidv7 } from "uuidv7";
import {
  CreateBomLineDtoType,
  UpdateBomLineDtoType,
} from "../api/dto/bom-line-req-dto";
import { NewBomLine } from "../db/schema";
import {
  BomLineRepoType,
  PartRepoType,
  PartVendorRepoType,
  ProjectBomRepoType,
  SupplierRepoType,
} from "../repository";
import { NotFoundError, ValidationError } from "../util/error";
import { recomputeAggregates } from "./project-bom-service";

export interface BomLineServiceDeps {
  bomLineRepo: BomLineRepoType;
  projectBomRepo: ProjectBomRepoType;
  partRepo: PartRepoType;
  partVendorRepo: PartVendorRepoType;
  supplierRepo: SupplierRepoType;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Lines may only be mutated while the BOM is in Draft (FRD §9 — engineer edits
// the draft; once submitted for review the BOM is locked).
const assertDraft = async (bomId: string, deps: BomLineServiceDeps) => {
  const bom = await deps.projectBomRepo.findById(bomId);
  if (!bom) throw new NotFoundError("BOM not found");
  if (bom.stage !== "Draft") {
    throw new ValidationError(
      `BOM is "${bom.stage}" — lines can only be edited while in Draft`
    );
  }
  return bom;
};

const add = async (
  bomId: string,
  dto: CreateBomLineDtoType,
  deps: BomLineServiceDeps
) => {
  await assertDraft(bomId, deps);

  const part = await deps.partRepo.findById(dto.part_id);
  if (!part) throw new ValidationError("part_id does not exist");

  if (dto.vendor_id) {
    const vendor = await deps.supplierRepo.findById(dto.vendor_id);
    if (!vendor) throw new ValidationError("vendor_id does not exist");
  }

  const unitCost = dto.unit_cost ?? Number(part.unit_cost);
  const extended = round2(dto.quantity * unitCost);
  const findNumber = (await deps.bomLineRepo.maxFindNumber(bomId)) + 1;

  // Default the line vendor to the material's first preferred vendor when the
  // caller doesn't pick one explicitly.
  const preferredVendorIds = await deps.partVendorRepo.listVendorIdsByPart(
    part.id
  );

  const newLine: NewBomLine = {
    id: uuidv7(),
    bom_id: bomId,
    part_id: part.id,
    find_number: findNumber,
    level: 1,
    parent_line_id: null,

    // Snapshot from the material.
    part_number: part.part_number,
    name: part.name,
    description: part.remarks,
    category: part.category,
    uom: part.uom,
    unit_cost: unitCost.toString(),
    procurement: part.sourcing,
    lead_time_days: part.lead_time_days,
    material_revision: part.revision,

    // Line-specific.
    quantity: dto.quantity.toString(),
    extended_cost: extended.toString(),
    ref_designator: dto.ref_designator ?? "",
    remarks: dto.remarks ?? "",
    buying_notes: dto.buying_notes ?? "",
    drawing_ref: dto.drawing_ref ?? part.drawing_ref,
    vendor_id: dto.vendor_id ?? preferredVendorIds[0] ?? null,
    is_critical: dto.is_critical ?? false,
  };

  const created = await deps.bomLineRepo.create(newLine);
  if (!created) throw new ValidationError("Failed to add BOM line");

  await recomputeAggregates(bomId, deps);
  return created;
};

const listByBom = async (bomId: string, deps: BomLineServiceDeps) => {
  const bom = await deps.projectBomRepo.findById(bomId);
  if (!bom) throw new NotFoundError("BOM not found");
  return deps.bomLineRepo.listByBom(bomId);
};

const update = async (
  lineId: string,
  dto: UpdateBomLineDtoType,
  deps: BomLineServiceDeps
) => {
  const line = await deps.bomLineRepo.findById(lineId);
  if (!line) throw new NotFoundError("BOM line not found");
  await assertDraft(line.bom_id, deps);

  if (dto.vendor_id) {
    const vendor = await deps.supplierRepo.findById(dto.vendor_id);
    if (!vendor) throw new ValidationError("vendor_id does not exist");
  }

  const patch: Partial<NewBomLine> = {};
  if (dto.ref_designator !== undefined) patch.ref_designator = dto.ref_designator;
  if (dto.remarks !== undefined) patch.remarks = dto.remarks;
  if (dto.buying_notes !== undefined) patch.buying_notes = dto.buying_notes;
  if (dto.drawing_ref !== undefined) patch.drawing_ref = dto.drawing_ref;
  if (dto.is_critical !== undefined) patch.is_critical = dto.is_critical;
  if (dto.vendor_id !== undefined) patch.vendor_id = dto.vendor_id;

  // Recompute extended cost if quantity or unit_cost changed.
  const quantity = dto.quantity ?? Number(line.quantity);
  const unitCost = dto.unit_cost ?? Number(line.unit_cost);
  if (dto.quantity !== undefined) patch.quantity = dto.quantity.toString();
  if (dto.unit_cost !== undefined) patch.unit_cost = dto.unit_cost.toString();
  if (dto.quantity !== undefined || dto.unit_cost !== undefined) {
    patch.extended_cost = round2(quantity * unitCost).toString();
  }

  const updated = await deps.bomLineRepo.update(lineId, patch);
  if (!updated) throw new ValidationError("Failed to update BOM line");

  await recomputeAggregates(line.bom_id, deps);
  return updated;
};

const remove = async (lineId: string, deps: BomLineServiceDeps) => {
  const line = await deps.bomLineRepo.findById(lineId);
  if (!line) throw new NotFoundError("BOM line not found");
  await assertDraft(line.bom_id, deps);

  const ok = await deps.bomLineRepo.softDelete(lineId);
  if (!ok) throw new NotFoundError("BOM line not found");

  await recomputeAggregates(line.bom_id, deps);
  return { message: "BOM line removed successfully" };
};

export const bomLineService = {
  add,
  listByBom,
  update,
  remove,
};
