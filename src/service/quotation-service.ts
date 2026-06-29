import { uuidv7 } from "uuidv7";
import { CreateQuotationDtoType } from "../api/dto/quotation-req-dto";
import { NewQuotation, NewQuotationLine, Quotation } from "../db/schema";
import {
  QuotationLineRepoType,
  QuotationRepoType,
  RfqLineRepoType,
  RfqRepoType,
  SupplierRepoType,
} from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

export interface QuotationServiceDeps {
  quotationRepo: QuotationRepoType;
  quotationLineRepo: QuotationLineRepoType;
  rfqRepo: RfqRepoType;
  rfqLineRepo: RfqLineRepoType;
  supplierRepo: SupplierRepoType;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const create = async (
  rfqId: string,
  dto: CreateQuotationDtoType,
  deps: QuotationServiceDeps
) => {
  const rfq = await deps.rfqRepo.findById(rfqId);
  if (!rfq) throw new NotFoundError("RFQ not found");
  if (rfq.status === "Draft") {
    throw new ValidationError("RFQ has not been sent yet");
  }
  if (!rfq.vendor_ids.includes(dto.vendor_id)) {
    throw new ValidationError("Vendor was not invited to this RFQ");
  }

  const vendor = await deps.supplierRepo.findById(dto.vendor_id);
  if (!vendor) throw new ValidationError("vendor_id does not exist");

  if (await deps.quotationRepo.findByRfqAndVendor(rfqId, dto.vendor_id)) {
    throw new ConflictError("This vendor has already submitted a quotation");
  }

  // Map RFQ lines for quantity + ownership validation.
  const rfqLines = await deps.rfqLineRepo.listByRfq(rfqId);
  const rfqLineById = new Map(rfqLines.map((l) => [l.id, l]));

  const quotationId = uuidv7();
  const lineRows: NewQuotationLine[] = [];
  let total = 0;

  for (const li of dto.lines) {
    const rfqLine = rfqLineById.get(li.rfq_line_id);
    if (!rfqLine) {
      throw new ValidationError(
        `rfq_line_id ${li.rfq_line_id} does not belong to this RFQ`
      );
    }
    const qty = Number(rfqLine.quantity);
    const extended = round2(qty * li.unit_price);
    total += extended;
    lineRows.push({
      id: uuidv7(),
      quotation_id: quotationId,
      rfq_line_id: rfqLine.id,
      part_number: rfqLine.part_number,
      quantity: rfqLine.quantity,
      unit_price: li.unit_price.toString(),
      extended_price: extended.toString(),
      lead_time_days: li.lead_time_days ?? 0,
      remarks: li.remarks ?? "",
    });
  }

  const newQuotation: NewQuotation = {
    id: quotationId,
    rfq_id: rfqId,
    vendor_id: dto.vendor_id,
    vendor_name: vendor.name,
    status: "Received",
    total_value: total.toFixed(2),
    lead_time_days: dto.lead_time_days ?? 0,
    payment_terms: dto.payment_terms ?? vendor.payment_terms,
    validity_days: dto.validity_days ?? 30,
    delivery_terms: dto.delivery_terms ?? "",
    line_count: lineRows.length,
    received_at: new Date(),
  };

  const created = await deps.quotationRepo.create(newQuotation);
  if (!created) throw new ValidationError("Failed to record quotation");
  const lines = await deps.quotationLineRepo.createMany(lineRows);

  // Bump RFQ received count; first quote moves Sent → Quotes In.
  await deps.rfqRepo.update(rfqId, {
    quotes_received: rfq.quotes_received + 1,
    status: rfq.status === "Sent" ? "Quotes In" : rfq.status,
  });

  return { ...created, lines };
};

const listByRfq = async (rfqId: string, deps: QuotationServiceDeps) => {
  const rfq = await deps.rfqRepo.findById(rfqId);
  if (!rfq) throw new NotFoundError("RFQ not found");
  return deps.quotationRepo.listByRfq(rfqId);
};

const getDetail = async (id: string, deps: QuotationServiceDeps) => {
  const quotation = await deps.quotationRepo.findById(id);
  if (!quotation) throw new NotFoundError("Quotation not found");
  const lines = await deps.quotationLineRepo.listByQuotation(id);
  return { ...quotation, lines };
};

// Rank quotations by total value (cheapest = rank 1, score 100) and persist.
const compare = async (rfqId: string, deps: QuotationServiceDeps) => {
  const rfq = await deps.rfqRepo.findById(rfqId);
  if (!rfq) throw new NotFoundError("RFQ not found");

  const quotes = await deps.quotationRepo.listByRfq(rfqId); // sorted by total asc
  if (quotes.length === 0) {
    throw new ValidationError("No quotations to compare yet");
  }

  const minTotal = Math.min(...quotes.map((q) => Number(q.total_value)));
  const ranked: Quotation[] = [];
  let rank = 1;
  for (const q of quotes) {
    const total = Number(q.total_value);
    const score = total > 0 ? round2((minTotal / total) * 100) : 100;
    const updated = await deps.quotationRepo.update(q.id, {
      rank,
      score: score.toString(),
      status: q.status === "Awarded" ? "Awarded" : "Under Review",
    });
    if (updated) ranked.push(updated);
    rank++;
  }

  await deps.rfqRepo.update(rfqId, { status: "Comparison" });
  return { rfqId, recommended: ranked[0], quotations: ranked };
};

// Award a quotation: mark it Awarded, the rest Rejected, RFQ → Awarded.
const award = async (quotationId: string, deps: QuotationServiceDeps) => {
  const quotation = await deps.quotationRepo.findById(quotationId);
  if (!quotation) throw new NotFoundError("Quotation not found");

  const siblings = await deps.quotationRepo.listByRfq(quotation.rfq_id);
  for (const q of siblings) {
    await deps.quotationRepo.update(q.id, {
      status: q.id === quotationId ? "Awarded" : "Rejected",
    });
  }
  await deps.rfqRepo.update(quotation.rfq_id, { status: "Awarded" });

  const updated = await deps.quotationRepo.findById(quotationId);
  return updated;
};

export const quotationService = {
  create,
  listByRfq,
  getDetail,
  compare,
  award,
};
