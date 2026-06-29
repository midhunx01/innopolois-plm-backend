import { uuidv7 } from "uuidv7";
import {
  CreateWarehouseDtoType,
  UpdateWarehouseDtoType,
} from "../api/dto/warehouse-req-dto";
import { NewWarehouse } from "../db/schema";
import { StockBalanceRepoType, WarehouseRepoType } from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

export interface WarehouseServiceDeps {
  warehouseRepo: WarehouseRepoType;
  stockBalanceRepo: StockBalanceRepoType;
}

const numOpt = (v: number | undefined): string | undefined =>
  v === undefined ? undefined : v.toString();

const create = async (
  dto: CreateWarehouseDtoType,
  repo: WarehouseRepoType
) => {
  const code = dto.code.trim().toUpperCase();
  if (await repo.findByCode(code)) {
    throw new ConflictError(`A warehouse with code "${code}" already exists`);
  }
  const newWarehouse: NewWarehouse = {
    id: uuidv7(),
    code,
    name: dto.name,
    type: dto.type ?? "Distribution",
    city: dto.city ?? "",
    country: dto.country ?? "India",
    capacity_pct: numOpt(dto.capacity_pct) ?? "0",
    lat: numOpt(dto.lat) ?? null,
    lng: numOpt(dto.lng) ?? null,
  };
  const created = await repo.create(newWarehouse);
  if (!created) throw new ValidationError("Failed to create warehouse");
  return created;
};

const list = async (repo: WarehouseRepoType) => repo.list();

// Warehouse + live stock summary (sku count, value, low-stock items).
const getDetail = async (id: string, deps: WarehouseServiceDeps) => {
  const warehouse = await deps.warehouseRepo.findById(id);
  if (!warehouse) throw new NotFoundError("Warehouse not found");
  const summary = await deps.stockBalanceRepo.warehouseSummary(id);
  return { ...warehouse, ...summary };
};

const update = async (
  id: string,
  dto: UpdateWarehouseDtoType,
  repo: WarehouseRepoType
) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("Warehouse not found");

  const patch: Partial<NewWarehouse> = {};
  if (dto.code !== undefined) {
    const code = dto.code.trim().toUpperCase();
    if (code !== existing.code) {
      if (await repo.findByCode(code)) {
        throw new ConflictError(`A warehouse with code "${code}" already exists`);
      }
      patch.code = code;
    }
  }
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.type !== undefined) patch.type = dto.type;
  if (dto.city !== undefined) patch.city = dto.city;
  if (dto.country !== undefined) patch.country = dto.country;
  if (dto.capacity_pct !== undefined)
    patch.capacity_pct = dto.capacity_pct.toString();
  if (dto.lat !== undefined) patch.lat = dto.lat.toString();
  if (dto.lng !== undefined) patch.lng = dto.lng.toString();

  const updated = await repo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update warehouse");
  return updated;
};

const remove = async (id: string, repo: WarehouseRepoType) => {
  const ok = await repo.softDelete(id);
  if (!ok) throw new NotFoundError("Warehouse not found");
  return { message: "Warehouse deleted successfully" };
};

export const warehouseService = {
  create,
  list,
  getDetail,
  update,
  remove,
};
