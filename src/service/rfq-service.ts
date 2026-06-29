import { uuidv7 } from "uuidv7";
import { CreateRfqDtoType, UpdateRfqDtoType } from "../api/dto/rfq-req-dto";
import { NewRfq, NewRfqLine } from "../db/schema";
import {
  BomLineRepoType,
  CounterRepoType,
  PartRepoType,
  ProjectBomRepoType,
  QuotationRepoType,
  RfqFilters,
  RfqLineRepoType,
  RfqRepoType,
  SupplierRepoType,
} from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

export interface RfqServiceDeps {
  rfqRepo: RfqRepoType;
  rfqLineRepo: RfqLineRepoType;
  partRepo: PartRepoType;
  supplierRepo: SupplierRepoType;
  projectBomRepo: ProjectBomRepoType;
  bomLineRepo: BomLineRepoType;
  quotationRepo: QuotationRepoType;
  counterRepo: CounterRepoType;
}

const create = async (
  dto: CreateRfqDtoType,
  ownerId: string,
  deps: RfqServiceDeps
) => {
  // Validate invited vendors.
  for (const vid of dto.vendor_ids) {
    const v = await deps.supplierRepo.findById(vid);
    if (!v) throw new ValidationError(`vendor_id ${vid} does not exist`);
  }

  const rfqId = uuidv7();
  const lineRows: NewRfqLine[] = [];
  let estValue = 0;
  let lineNo = 1;

  if (dto.from_bom_id) {
    const bom = await deps.projectBomRepo.findById(dto.from_bom_id);
    if (!bom) throw new ValidationError("from_bom_id does not exist");
    let lines = await deps.bomLineRepo.listByBom(bom.id);
    if (dto.mode === "Category-wise" && dto.category) {
      lines = lines.filter((l) => l.category === dto.category);
    }
    if (lines.length === 0) {
      throw new ValidationError("No BOM lines match — nothing to quote");
    }
    for (const bl of lines) {
      estValue += Number(bl.quantity) * Number(bl.unit_cost);
      lineRows.push({
        id: uuidv7(),
        rfq_id: rfqId,
        part_id: bl.part_id,
        bom_line_id: bl.id,
        line_no: lineNo++,
        part_number: bl.part_number,
        description: bl.name,
        specification: bl.description,
        quantity: bl.quantity,
        uom: bl.uom,
        buying_notes: bl.buying_notes,
      });
    }
  } else if (dto.lines && dto.lines.length > 0) {
    for (const li of dto.lines) {
      const part = await deps.partRepo.findById(li.part_id);
      if (!part) throw new ValidationError(`part_id ${li.part_id} does not exist`);
      estValue += li.quantity * Number(part.unit_cost);
      lineRows.push({
        id: uuidv7(),
        rfq_id: rfqId,
        part_id: part.id,
        line_no: lineNo++,
        part_number: part.part_number,
        description: part.name,
        specification: li.specification ?? part.description,
        quantity: li.quantity.toString(),
        uom: part.uom,
        buying_notes: li.buying_notes ?? "",
      });
    }
  } else {
    throw new ValidationError("Provide either from_bom_id or lines");
  }

  const seq = await deps.counterRepo.next("rfq");
  const newRfq: NewRfq = {
    id: rfqId,
    number: `RFQ-${String(seq).padStart(4, "0")}`,
    title: dto.title,
    mode: dto.mode ?? "Vendor-wise",
    status: "Draft",
    project_id: dto.project_id ?? null,
    bom_id: dto.from_bom_id ?? null,
    category: dto.category ?? "",
    vendor_ids: dto.vendor_ids,
    line_items: lineRows.length,
    est_value: estValue.toFixed(2),
    quotes_expected: dto.vendor_ids.length,
    quotes_received: 0,
    required_date: dto.required_date ? new Date(dto.required_date) : null,
    owner_id: ownerId,
  };

  const created = await deps.rfqRepo.create(newRfq);
  if (!created) throw new ValidationError("Failed to create RFQ");
  const lines = await deps.rfqLineRepo.createMany(lineRows);
  return { ...created, lines };
};

const list = async (filters: RfqFilters, repo: RfqRepoType) => repo.list(filters);

const getDetail = async (id: string, deps: RfqServiceDeps) => {
  const rfq = await deps.rfqRepo.findById(id);
  if (!rfq) throw new NotFoundError("RFQ not found");
  const [lines, quotations] = await Promise.all([
    deps.rfqLineRepo.listByRfq(id),
    deps.quotationRepo.listByRfq(id),
  ]);
  return { ...rfq, lines, quotations };
};

const update = async (
  id: string,
  dto: UpdateRfqDtoType,
  repo: RfqRepoType
) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("RFQ not found");
  if (existing.status !== "Draft") {
    throw new ValidationError("Only a Draft RFQ can be edited");
  }
  const patch: Partial<NewRfq> = {};
  if (dto.title !== undefined) patch.title = dto.title;
  if (dto.mode !== undefined) patch.mode = dto.mode;
  if (dto.category !== undefined) patch.category = dto.category;
  if (dto.required_date !== undefined)
    patch.required_date = new Date(dto.required_date);
  const updated = await repo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update RFQ");
  return updated;
};

// Issue the RFQ to its vendors (Draft → Sent).
const send = async (id: string, repo: RfqRepoType) => {
  const rfq = await repo.findById(id);
  if (!rfq) throw new NotFoundError("RFQ not found");
  if (rfq.status !== "Draft") {
    throw new ConflictError(`RFQ is already "${rfq.status}"`);
  }
  const updated = await repo.update(id, { status: "Sent" });
  if (!updated) throw new ValidationError("Failed to send RFQ");
  return updated;
};

const remove = async (id: string, repo: RfqRepoType) => {
  const rfq = await repo.findById(id);
  if (!rfq) throw new NotFoundError("RFQ not found");
  if (rfq.status !== "Draft") {
    throw new ConflictError("Only a Draft RFQ can be deleted");
  }
  const ok = await repo.softDelete(id);
  if (!ok) throw new NotFoundError("RFQ not found");
  return { message: "RFQ deleted successfully" };
};

export const rfqService = {
  create,
  list,
  getDetail,
  update,
  send,
  remove,
};
