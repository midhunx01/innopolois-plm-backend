import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { DB } from "../db/db-connection";
import {
  parts,
  projectBoms,
  projects,
  purchaseOrders,
  rfqs,
  stockBalances,
  suppliers,
  warehouses,
} from "../db/schema";
import { logger } from "../util";

export type ReportRepoType = {
  dashboard: () => Promise<Record<string, unknown>>;
  purchaseValueByStatus: () => Promise<
    { status: string; count: number; value: string }[]
  >;
  vendorPerformance: () => Promise<Record<string, unknown>[]>;
  stockValueByWarehouse: () => Promise<Record<string, unknown>[]>;
  vendorSpend: () => Promise<Record<string, unknown>[]>;
  projectCost: () => Promise<Record<string, unknown>[]>;
};

const scalar = async (q: Promise<{ v: number | string }[]>): Promise<number> => {
  const [row] = await q;
  return Number(row?.v ?? 0);
};

const dashboard = async (): Promise<Record<string, unknown>> => {
  try {
    const [
      projectCount,
      materialCount,
      vendorCount,
      openRfqs,
      openPos,
      stockValue,
      lowStock,
      poValue,
      bomsByStage,
    ] = await Promise.all([
      scalar(
        DB.select({ v: sql<number>`count(*)::int` })
          .from(projects)
          .where(isNull(projects.deleted_at))
      ),
      scalar(
        DB.select({ v: sql<number>`count(*)::int` })
          .from(parts)
          .where(isNull(parts.deleted_at))
      ),
      scalar(
        DB.select({ v: sql<number>`count(*)::int` })
          .from(suppliers)
          .where(isNull(suppliers.deleted_at))
      ),
      scalar(
        DB.select({ v: sql<number>`count(*)::int` })
          .from(rfqs)
          .where(
            and(
              isNull(rfqs.deleted_at),
              sql`${rfqs.status} in ('Sent','Quotes In','Comparison')`
            )
          )
      ),
      scalar(
        DB.select({ v: sql<number>`count(*)::int` })
          .from(purchaseOrders)
          .where(
            and(
              isNull(purchaseOrders.deleted_at),
              sql`${purchaseOrders.status} in ('Pending Approval','Open','Partially Received')`
            )
          )
      ),
      scalar(
        DB.select({
          v: sql<string>`coalesce(sum(${stockBalances.on_hand} * ${stockBalances.unit_cost}), 0)::text`,
        }).from(stockBalances)
      ),
      scalar(
        DB.select({ v: sql<number>`count(*)::int` })
          .from(stockBalances)
          .where(sql`${stockBalances.on_hand} <= ${stockBalances.reorder_point}`)
      ),
      scalar(
        DB.select({
          v: sql<string>`coalesce(sum(${purchaseOrders.total_value}), 0)::text`,
        })
          .from(purchaseOrders)
          .where(
            and(
              isNull(purchaseOrders.deleted_at),
              ne(purchaseOrders.status, "Cancelled")
            )
          )
      ),
      DB.select({
        stage: projectBoms.stage,
        count: sql<number>`count(*)::int`,
      })
        .from(projectBoms)
        .where(isNull(projectBoms.deleted_at))
        .groupBy(projectBoms.stage),
    ]);

    return {
      projects: projectCount,
      materials: materialCount,
      vendors: vendorCount,
      openRfqs,
      openPurchaseOrders: openPos,
      stockValue: stockValue.toFixed(2),
      lowStockItems: lowStock,
      committedPoValue: poValue.toFixed(2),
      bomsByStage,
    };
  } catch (error) {
    logger.error(`[Report Repo]: dashboard error: ${error}`);
    throw error;
  }
};

const purchaseValueByStatus = async () => {
  try {
    return await DB
      .select({
        status: purchaseOrders.status,
        count: sql<number>`count(*)::int`,
        value: sql<string>`coalesce(sum(${purchaseOrders.total_value}), 0)::text`,
      })
      .from(purchaseOrders)
      .where(isNull(purchaseOrders.deleted_at))
      .groupBy(purchaseOrders.status);
  } catch (error) {
    logger.error(`[Report Repo]: purchaseValueByStatus error: ${error}`);
    throw error;
  }
};

const vendorPerformance = async () => {
  try {
    return await DB
      .select({
        id: suppliers.id,
        name: suppliers.name,
        code: suppliers.code,
        tier: suppliers.tier,
        rating: suppliers.rating,
        onTimePct: suppliers.on_time_pct,
        qualityPct: suppliers.quality_pct,
        riskScore: suppliers.risk_score,
        status: suppliers.status,
        poCount: sql<number>`count(${purchaseOrders.id})::int`,
        poSpend: sql<string>`coalesce(sum(${purchaseOrders.total_value}), 0)::text`,
      })
      .from(suppliers)
      .leftJoin(
        purchaseOrders,
        and(
          eq(purchaseOrders.supplier_id, suppliers.id),
          isNull(purchaseOrders.deleted_at),
          ne(purchaseOrders.status, "Cancelled")
        )
      )
      .where(isNull(suppliers.deleted_at))
      .groupBy(suppliers.id)
      .orderBy(desc(suppliers.rating));
  } catch (error) {
    logger.error(`[Report Repo]: vendorPerformance error: ${error}`);
    throw error;
  }
};

const stockValueByWarehouse = async () => {
  try {
    return await DB
      .select({
        warehouseId: warehouses.id,
        code: warehouses.code,
        name: warehouses.name,
        skuCount: sql<number>`count(${stockBalances.id})::int`,
        stockValue: sql<string>`coalesce(sum(${stockBalances.on_hand} * ${stockBalances.unit_cost}), 0)::text`,
        lowStockItems: sql<number>`count(*) filter (where ${stockBalances.on_hand} <= ${stockBalances.reorder_point} and ${stockBalances.id} is not null)::int`,
      })
      .from(warehouses)
      .leftJoin(stockBalances, eq(stockBalances.warehouse_id, warehouses.id))
      .where(isNull(warehouses.deleted_at))
      .groupBy(warehouses.id)
      .orderBy(desc(sql`coalesce(sum(${stockBalances.on_hand} * ${stockBalances.unit_cost}), 0)`));
  } catch (error) {
    logger.error(`[Report Repo]: stockValueByWarehouse error: ${error}`);
    throw error;
  }
};

const vendorSpend = async () => {
  try {
    return await DB
      .select({
        supplierId: purchaseOrders.supplier_id,
        supplierName: purchaseOrders.supplier_name,
        poCount: sql<number>`count(*)::int`,
        spend: sql<string>`coalesce(sum(${purchaseOrders.total_value}), 0)::text`,
      })
      .from(purchaseOrders)
      .where(
        and(
          isNull(purchaseOrders.deleted_at),
          ne(purchaseOrders.status, "Cancelled")
        )
      )
      .groupBy(purchaseOrders.supplier_id, purchaseOrders.supplier_name)
      .orderBy(desc(sql`coalesce(sum(${purchaseOrders.total_value}), 0)`));
  } catch (error) {
    logger.error(`[Report Repo]: vendorSpend error: ${error}`);
    throw error;
  }
};

const projectCost = async () => {
  try {
    return await DB
      .select({
        projectId: projects.id,
        projectNumber: projects.project_number,
        name: projects.name,
        customer: projects.customer,
        stage: projects.stage,
        bomCount: sql<number>`count(${projectBoms.id})::int`,
        bomValue: sql<string>`coalesce(sum(${projectBoms.total_value}), 0)::text`,
      })
      .from(projects)
      .leftJoin(
        projectBoms,
        and(
          eq(projectBoms.project_id, projects.id),
          isNull(projectBoms.deleted_at)
        )
      )
      .where(isNull(projects.deleted_at))
      .groupBy(projects.id)
      .orderBy(desc(sql`coalesce(sum(${projectBoms.total_value}), 0)`));
  } catch (error) {
    logger.error(`[Report Repo]: projectCost error: ${error}`);
    throw error;
  }
};

export const reportRepo: ReportRepoType = {
  dashboard,
  purchaseValueByStatus,
  vendorPerformance,
  stockValueByWarehouse,
  vendorSpend,
  projectCost,
};
