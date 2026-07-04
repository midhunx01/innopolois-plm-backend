import { uuidv7 } from "uuidv7";
import {
  CreatePoDtoType,
  ReceivePoDtoType,
  UpdatePoStatusDtoType,
} from "../api/dto/purchase-order-req-dto";
import { NewPoLine, NewPurchaseOrder, PoStatus } from "../db/schema";
import {
  CounterRepoType,
  PartPriceHistoryRepoType,
  PartRepoType,
  PoFilters,
  PoLineRepoType,
  PurchaseOrderRepoType,
  QuotationLineRepoType,
  QuotationRepoType,
  RfqLineRepoType,
  StockBalanceRepoType,
  StockMovementRepoType,
  SupplierRepoType,
  WarehouseRepoType,
} from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";
import { postMovement } from "./inventory-service";

export interface PurchaseOrderServiceDeps {
  poRepo: PurchaseOrderRepoType;
  poLineRepo: PoLineRepoType;
  supplierRepo: SupplierRepoType;
  quotationRepo: QuotationRepoType;
  quotationLineRepo: QuotationLineRepoType;
  rfqLineRepo: RfqLineRepoType;
  partRepo: PartRepoType;
  partPriceHistoryRepo: PartPriceHistoryRepoType;
  counterRepo: CounterRepoType;
  // Inventory wiring — goods receipt posts accepted stock (FRD §14).
  stockBalanceRepo: StockBalanceRepoType;
  stockMovementRepo: StockMovementRepoType;
  warehouseRepo: WarehouseRepoType;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Receipt-derived states reflect physical goods arrival. They may ONLY be
// reached through the goods-receipt endpoint (receive()), which books stock and
// computes received_pct from the actual received quantities. Reaching them via
// the plain status pipeline flips the label with no stock posted — fabricating
// completion (bug F1b: a PO could show "Received" while nothing entered stock).
const RECEIPT_DERIVED: PoStatus[] = ["Partially Received", "Received"];

// Allowed *manual* PO status transitions (FRD §13). Receipt-derived states are
// intentionally excluded as targets — only receive() may set them. A partially
// received PO may be short-closed (close out the remainder) without claiming a
// full receipt.
const PO_TRANSITIONS: Record<PoStatus, PoStatus[]> = {
  Draft: ["Pending Approval", "Open", "Cancelled"],
  "Pending Approval": ["Open", "Draft", "Cancelled"],
  Open: ["Cancelled"],
  "Partially Received": ["Closed", "Cancelled"],
  Received: ["Closed"],
  Closed: [],
  Cancelled: [],
};

const create = async (
  dto: CreatePoDtoType,
  ownerId: string,
  deps: PurchaseOrderServiceDeps
) => {
  const poId = uuidv7();
  const lineRows: NewPoLine[] = [];
  let total = 0;
  let lineNo = 1;

  let supplierId: string;
  let supplierName: string;
  let rfqId: string | null = null;
  let quotationId: string | null = null;

  if (dto.from_quotation_id) {
    const quotation = await deps.quotationRepo.findById(dto.from_quotation_id);
    if (!quotation) throw new ValidationError("from_quotation_id does not exist");
    if (quotation.status !== "Awarded") {
      throw new ValidationError("Only an awarded quotation can become a PO");
    }
    const supplier = await deps.supplierRepo.findById(quotation.vendor_id);
    if (!supplier) throw new ValidationError("quotation vendor no longer exists");
    supplierId = supplier.id;
    supplierName = supplier.name;
    rfqId = quotation.rfq_id;
    quotationId = quotation.id;

    const qLines = await deps.quotationLineRepo.listByQuotation(quotation.id);
    for (const ql of qLines) {
      const rfqLine = await deps.rfqLineRepo.findById(ql.rfq_line_id);
      if (!rfqLine) continue;
      const qty = Number(ql.quantity);
      const price = Number(ql.unit_price);
      const extended = round2(qty * price);
      total += extended;
      lineRows.push({
        id: uuidv7(),
        po_id: poId,
        part_id: rfqLine.part_id,
        line_no: lineNo++,
        part_number: rfqLine.part_number,
        description: rfqLine.description,
        quantity: ql.quantity,
        uom: rfqLine.uom,
        unit_price: ql.unit_price,
        extended_price: extended.toString(),
      });
    }
  } else {
    if (!dto.supplier_id) {
      throw new ValidationError("supplier_id is required for a manual PO");
    }
    if (!dto.lines || dto.lines.length === 0) {
      throw new ValidationError("A manual PO needs at least one line");
    }
    const supplier = await deps.supplierRepo.findById(dto.supplier_id);
    if (!supplier) throw new ValidationError("supplier_id does not exist");
    supplierId = supplier.id;
    supplierName = supplier.name;

    for (const li of dto.lines) {
      const part = await deps.partRepo.findById(li.part_id);
      if (!part) throw new ValidationError(`part_id ${li.part_id} does not exist`);
      const extended = round2(li.quantity * li.unit_price);
      total += extended;
      lineRows.push({
        id: uuidv7(),
        po_id: poId,
        part_id: part.id,
        line_no: lineNo++,
        part_number: part.part_number,
        description: part.name,
        quantity: li.quantity.toString(),
        uom: part.uom,
        unit_price: li.unit_price.toString(),
        extended_price: extended.toString(),
      });
    }
  }

  if (lineRows.length === 0) {
    throw new ValidationError("PO has no lines");
  }

  const seq = await deps.counterRepo.next("po");
  const newPo: NewPurchaseOrder = {
    id: poId,
    number: `PO-${String(seq).padStart(4, "0")}`,
    supplier_id: supplierId,
    supplier_name: supplierName,
    rfq_id: rfqId,
    quotation_id: quotationId,
    project_id: dto.project_id ?? null,
    status: "Draft",
    priority: dto.priority ?? "Medium",
    line_items: lineRows.length,
    total_value: total.toFixed(2),
    received_pct: "0",
    ordered_date: new Date(),
    expected_date: dto.expected_date ? new Date(dto.expected_date) : null,
    owner_id: ownerId,
  };

  const created = await deps.poRepo.create(newPo);
  if (!created) throw new ValidationError("Failed to create PO");
  const lines = await deps.poLineRepo.createMany(lineRows);
  return { ...created, lines };
};

const list = async (filters: PoFilters, repo: PurchaseOrderRepoType) =>
  repo.list(filters);

const getDetail = async (id: string, deps: PurchaseOrderServiceDeps) => {
  const po = await deps.poRepo.findById(id);
  if (!po) throw new NotFoundError("PO not found");
  const lines = await deps.poLineRepo.listByPo(id);
  return { ...po, lines };
};

const updateStatus = async (
  id: string,
  dto: UpdatePoStatusDtoType,
  deps: PurchaseOrderServiceDeps
) => {
  const po = await deps.poRepo.findById(id);
  if (!po) throw new NotFoundError("PO not found");

  // Block the loophole: receipt-derived states can't be set by hand — they must
  // come from an actual goods receipt so stock and received_pct stay truthful.
  if (RECEIPT_DERIVED.includes(dto.status)) {
    throw new ValidationError(
      `"${dto.status}" is set by recording a goods receipt, not by the status ` +
        `pipeline. Receive goods via POST /api/purchase-orders/${id}/receive.`
    );
  }

  const allowed = PO_TRANSITIONS[po.status];
  if (!allowed.includes(dto.status)) {
    throw new ValidationError(
      `Cannot move a PO from "${po.status}" to "${dto.status}"`
    );
  }
  const updated = await deps.poRepo.update(id, { status: dto.status });
  if (!updated) throw new ValidationError("Failed to update PO status");
  return updated;
};

// Record goods receipt (FRD §13/§14). Updates per-line received_qty and the
// PO's received_pct + status. Stock posting is handled by the Inventory module.
const receive = async (
  id: string,
  dto: ReceivePoDtoType,
  deps: PurchaseOrderServiceDeps
) => {
  const po = await deps.poRepo.findById(id);
  if (!po) throw new NotFoundError("PO not found");
  if (po.status !== "Open" && po.status !== "Partially Received") {
    throw new ValidationError(
      `PO must be Open to receive goods (currently "${po.status}")`
    );
  }

  const lines = await deps.poLineRepo.listByPo(id);
  const lineById = new Map(lines.map((l) => [l.id, l]));
  const invDeps = {
    stockBalanceRepo: deps.stockBalanceRepo,
    stockMovementRepo: deps.stockMovementRepo,
    warehouseRepo: deps.warehouseRepo,
    partRepo: deps.partRepo,
  };
  // One timestamp for the whole receipt, shared by stock, price history and the
  // material's last_purchase_date.
  const receivedAt = new Date();

  for (const r of dto.lines) {
    const line = lineById.get(r.po_line_id);
    if (!line) {
      throw new ValidationError(
        `po_line_id ${r.po_line_id} does not belong to this PO`
      );
    }
    if (r.received_qty > Number(line.quantity)) {
      throw new ValidationError(
        `received_qty for ${line.part_number} exceeds ordered quantity`
      );
    }
    const rejected = r.rejected_qty ?? 0;
    if (rejected > r.received_qty) {
      throw new ValidationError(
        `rejected_qty for ${line.part_number} exceeds received quantity`
      );
    }
    await deps.poLineRepo.update(line.id, {
      received_qty: r.received_qty.toString(),
    });
    line.received_qty = r.received_qty.toString(); // reflect for recompute below

    // Post accepted goods into stock (FRD §14). warehouse_id is required, so a
    // receipt always books a movement. Rejected qty is recorded on the movement
    // but never increases on-hand.
    if (r.received_qty > 0) {
      const accepted = r.received_qty - rejected;
      await postMovement(
        {
          part_id: line.part_id,
          warehouse_id: dto.warehouse_id,
          type: "purchase",
          direction: "in",
          quantity: accepted,
          unit_cost: Number(line.unit_price),
          inspection_status: accepted > 0 ? "Accepted" : "Rejected",
          rejected_qty: rejected,
          batch: r.batch ?? "",
          reference: po.number,
          reference_id: po.id,
        },
        invDeps
      );

      // This is a realised vendor purchase — record the price in the material's
      // ledger and refresh its last_purchase_price / last_purchase_date.
      await deps.partPriceHistoryRepo.create({
        id: uuidv7(),
        part_id: line.part_id,
        unit_price: line.unit_price,
        source: "Purchase",
        vendor_id: po.supplier_id ?? null,
        purchase_order_id: po.id,
        reference: po.number,
        quantity: accepted.toString(),
        effective_date: receivedAt,
      });
      await deps.partRepo.update(line.part_id, {
        last_purchase_price: line.unit_price,
        last_purchase_date: receivedAt,
        last_purchase_vendor_id: po.supplier_id ?? null,
      });
    }
  }

  const totalQty = lines.reduce((s, l) => s + Number(l.quantity), 0);
  const totalReceived = lines.reduce((s, l) => s + Number(l.received_qty), 0);
  const pct = totalQty > 0 ? round2((totalReceived / totalQty) * 100) : 0;
  const status: PoStatus =
    totalReceived >= totalQty && totalQty > 0 ? "Received" : "Partially Received";

  const updated = await deps.poRepo.update(id, {
    received_pct: pct.toString(),
    status,
  });
  const refreshedLines = await deps.poLineRepo.listByPo(id);
  return { ...updated!, lines: refreshedLines };
};

const remove = async (id: string, deps: PurchaseOrderServiceDeps) => {
  const po = await deps.poRepo.findById(id);
  if (!po) throw new NotFoundError("PO not found");
  if (po.status !== "Draft" && po.status !== "Cancelled") {
    throw new ConflictError("Only Draft or Cancelled POs can be deleted");
  }
  const ok = await deps.poRepo.softDelete(id);
  if (!ok) throw new NotFoundError("PO not found");
  return { message: "PO deleted successfully" };
};

export const purchaseOrderService = {
  create,
  list,
  getDetail,
  updateStatus,
  receive,
  remove,
};
