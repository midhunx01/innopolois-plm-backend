import { uuidv7 } from "uuidv7";
import {
  AdjustStockDtoType,
  OpeningStockDtoType,
  TransferStockDtoType,
} from "../api/dto/inventory-req-dto";
import {
  Availability,
  InspectionStatus,
  NewStockBalance,
  StockDirection,
  StockMovementType,
} from "../db/schema";
import { DbClient } from "../db/db-connection";
import {
  MovementFilters,
  PartRepoType,
  StockBalanceRepoType,
  StockFilters,
  StockMovementRepoType,
  WarehouseRepoType,
} from "../repository";
import { NotFoundError, ValidationError } from "../util/error";

export interface InventoryServiceDeps {
  stockBalanceRepo: StockBalanceRepoType;
  stockMovementRepo: StockMovementRepoType;
  warehouseRepo: WarehouseRepoType;
  partRepo: PartRepoType;
}

export interface MovementArgs {
  part_id: string;
  warehouse_id: string;
  type: StockMovementType;
  direction: StockDirection;
  quantity: number;
  unit_cost?: number;
  inspection_status?: InspectionStatus;
  rejected_qty?: number;
  batch?: string;
  reference?: string;
  reference_id?: string | null;
  note?: string;
  user_id?: string | null;
}

const deriveStatus = (onHand: number, reorderPoint: number): Availability => {
  if (onHand <= 0) return "Out of Stock";
  if (reorderPoint > 0 && onHand <= reorderPoint) return "Low Stock";
  return "In Stock";
};

/**
 * Core stock posting primitive. Records a movement, upserts the (part,warehouse)
 * balance, and keeps the Material Master's aggregate stock in sync. Used by
 * opening / adjustment / transfer and by PO goods receipt.
 */
export const postMovement = async (
  args: MovementArgs,
  deps: InventoryServiceDeps,
  // When called inside a transaction, all writes run on `tx` so the movement,
  // balance and aggregate update commit atomically with the caller's changes.
  tx?: DbClient
) => {
  const part = await deps.partRepo.findById(args.part_id);
  if (!part) throw new ValidationError("part_id does not exist");
  const warehouse = await deps.warehouseRepo.findById(args.warehouse_id);
  if (!warehouse) throw new ValidationError("warehouse_id does not exist");

  let balance = await deps.stockBalanceRepo.findByPartAndWarehouse(
    part.id,
    warehouse.id,
    tx
  );
  if (!balance) {
    const seed: NewStockBalance = {
      id: uuidv7(),
      part_id: part.id,
      warehouse_id: warehouse.id,
      part_number: part.part_number,
      part_name: part.name,
      warehouse_code: warehouse.code,
      on_hand: "0",
      reserved: "0",
      available: "0",
      incoming: "0",
      reorder_point: part.reorder_point,
      unit_cost: args.unit_cost != null ? args.unit_cost.toString() : part.unit_cost,
      uom: part.uom,
      status: "Out of Stock",
    };
    balance = await deps.stockBalanceRepo.create(seed, tx);
    if (!balance) throw new ValidationError("Failed to open stock balance");
  }

  const onHand = Number(balance.on_hand);
  const delta = args.direction === "in" ? args.quantity : -args.quantity;
  const newOnHand = onHand + delta;
  if (newOnHand < 0) {
    throw new ValidationError(
      `Insufficient stock: ${part.part_number} has ${onHand} on hand at ${warehouse.code}`
    );
  }
  const reserved = Number(balance.reserved);
  const reorderPoint = Number(balance.reorder_point);
  const status = deriveStatus(newOnHand, reorderPoint);

  const movement = await deps.stockMovementRepo.create(
    {
      id: uuidv7(),
      part_id: part.id,
      warehouse_id: warehouse.id,
      type: args.type,
      direction: args.direction,
      quantity: args.quantity.toString(),
      unit_cost: (args.unit_cost ?? Number(balance.unit_cost)).toString(),
      inspection_status: args.inspection_status ?? null,
      rejected_qty: (args.rejected_qty ?? 0).toString(),
      batch: args.batch ?? "",
      reference: args.reference ?? "",
      reference_id: args.reference_id ?? null,
      note: args.note ?? "",
      user_id: args.user_id ?? null,
    },
    tx
  );

  const updatedBalance = await deps.stockBalanceRepo.update(
    balance.id,
    {
      on_hand: newOnHand.toString(),
      available: (newOnHand - reserved).toString(),
      unit_cost:
        args.unit_cost != null ? args.unit_cost.toString() : balance.unit_cost,
      status,
    },
    tx
  );

  // Keep Material Master's aggregate stock + availability current (FRD §5).
  const totalOnHand = await deps.stockBalanceRepo.totalOnHandForPart(part.id, tx);
  await deps.partRepo.update(
    part.id,
    {
      stock_qty: totalOnHand.toString(),
      availability: deriveStatus(totalOnHand, Number(part.reorder_point)),
    },
    tx
  );

  return { movement, balance: updatedBalance };
};

const openingStock = async (
  dto: OpeningStockDtoType,
  userId: string,
  deps: InventoryServiceDeps
) => {
  // Seed reorder point on the balance if provided.
  if (dto.reorder_point != null) {
    const existing = await deps.stockBalanceRepo.findByPartAndWarehouse(
      dto.part_id,
      dto.warehouse_id
    );
    if (existing) {
      await deps.stockBalanceRepo.update(existing.id, {
        reorder_point: dto.reorder_point.toString(),
      });
    }
  }
  return postMovement(
    {
      part_id: dto.part_id,
      warehouse_id: dto.warehouse_id,
      type: "opening",
      direction: "in",
      quantity: dto.quantity,
      unit_cost: dto.unit_cost,
      batch: dto.batch,
      note: dto.note,
      user_id: userId,
    },
    deps
  );
};

const adjustStock = async (
  dto: AdjustStockDtoType,
  userId: string,
  deps: InventoryServiceDeps
) => {
  return postMovement(
    {
      part_id: dto.part_id,
      warehouse_id: dto.warehouse_id,
      type: dto.wastage ? "wastage" : "adjustment",
      direction: dto.direction,
      quantity: dto.quantity,
      note: dto.note,
      user_id: userId,
    },
    deps
  );
};

const transferStock = async (
  dto: TransferStockDtoType,
  userId: string,
  deps: InventoryServiceDeps
) => {
  if (dto.from_warehouse_id === dto.to_warehouse_id) {
    throw new ValidationError("Source and destination warehouses must differ");
  }
  const out = await postMovement(
    {
      part_id: dto.part_id,
      warehouse_id: dto.from_warehouse_id,
      type: "transfer_out",
      direction: "out",
      quantity: dto.quantity,
      reference: "transfer",
      note: dto.note,
      user_id: userId,
    },
    deps
  );
  const inn = await postMovement(
    {
      part_id: dto.part_id,
      warehouse_id: dto.to_warehouse_id,
      type: "transfer_in",
      direction: "in",
      quantity: dto.quantity,
      unit_cost: Number(out.balance!.unit_cost),
      reference: "transfer",
      note: dto.note,
      user_id: userId,
    },
    deps
  );
  return { from: out.balance, to: inn.balance };
};

const listBalances = async (
  filters: StockFilters,
  deps: InventoryServiceDeps
) => deps.stockBalanceRepo.list(filters);

const listMovements = async (
  filters: MovementFilters,
  deps: InventoryServiceDeps
) => deps.stockMovementRepo.list(filters);

const lowStockAlerts = async (deps: InventoryServiceDeps) =>
  deps.stockBalanceRepo.listLowStock();

export const inventoryService = {
  postMovement,
  openingStock,
  adjustStock,
  transferStock,
  listBalances,
  listMovements,
  lowStockAlerts,
};
