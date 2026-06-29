import { uuidv7 } from "uuidv7";
import {
  CreateSupplierDtoType,
  UpdateSupplierDtoType,
} from "../api/dto/supplier-req-dto";
import { NewSupplier } from "../db/schema";
import { SupplierFilters, SupplierRepoType } from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

const normalizeCode = (code: string) => code.trim().toUpperCase();

// Numeric columns are stored as strings by Drizzle.
const num = (v: number | undefined): string | undefined =>
  v === undefined ? undefined : v.toString();

const create = async (dto: CreateSupplierDtoType, repo: SupplierRepoType) => {
  const code = normalizeCode(dto.code);
  if (await repo.findByCode(code)) {
    throw new ConflictError(`A vendor with code "${code}" already exists`);
  }

  const newSupplier: NewSupplier = {
    id: uuidv7(),
    code,
    name: dto.name,
    country: dto.country ?? "India",
    region: dto.region ?? "Domestic",
    category: dto.category ?? "",
    categories_supplied: dto.categories_supplied ?? [],
    tier: dto.tier ?? 3,
    contact: dto.contact ?? "",
    email: dto.email ?? "",
    phone: dto.phone ?? "",
    address: dto.address ?? "",
    gst_vat: dto.gst_vat ?? "",
    payment_terms: dto.payment_terms ?? "",
    lead_time_avg: dto.lead_time_avg ?? 0,
    rating: num(dto.rating) ?? "0",
    on_time_pct: num(dto.on_time_pct) ?? "0",
    quality_pct: num(dto.quality_pct) ?? "0",
    risk_score: num(dto.risk_score) ?? "0",
    parts_supplied: dto.parts_supplied ?? 0,
    open_pos: dto.open_pos ?? 0,
    annual_spend: num(dto.annual_spend) ?? "0",
    status: dto.status ?? "Under Review",
    approved: dto.approved ?? false,
  };

  const created = await repo.create(newSupplier);
  if (!created) throw new ValidationError("Failed to create vendor");
  return created;
};

const list = async (filters: SupplierFilters, repo: SupplierRepoType) =>
  repo.list(filters);

const getById = async (id: string, repo: SupplierRepoType) => {
  const supplier = await repo.findById(id);
  if (!supplier) throw new NotFoundError("Vendor not found");
  return supplier;
};

const update = async (
  id: string,
  dto: UpdateSupplierDtoType,
  repo: SupplierRepoType
) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("Vendor not found");

  const patch: Partial<NewSupplier> = {};
  const numericKeys = [
    "rating",
    "on_time_pct",
    "quality_pct",
    "risk_score",
    "annual_spend",
  ] as const;

  for (const [key, value] of Object.entries(dto)) {
    if (value === undefined) continue;
    if (key === "code") {
      const code = normalizeCode(value as string);
      if (code !== existing.code) {
        if (await repo.findByCode(code)) {
          throw new ConflictError(`A vendor with code "${code}" already exists`);
        }
        patch.code = code;
      }
    } else if ((numericKeys as readonly string[]).includes(key)) {
      (patch as any)[key] = (value as number).toString();
    } else {
      (patch as any)[key] = value;
    }
  }

  const updated = await repo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update vendor");
  return updated;
};

const remove = async (id: string, repo: SupplierRepoType) => {
  const ok = await repo.softDelete(id);
  if (!ok) throw new NotFoundError("Vendor not found");
  return { message: "Vendor deleted successfully" };
};

export const supplierService = {
  create,
  list,
  getById,
  update,
  remove,
};
