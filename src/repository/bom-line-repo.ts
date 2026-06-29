import { and, asc, eq, isNull, sql, SQL } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { BomLine, NewBomLine, bomLines, suppliers } from "../db/schema";
import { logger } from "../util";

export interface BomAggregate {
  lineItems: number;
  uniqueMaterials: number;
  totalValue: string;
  criticalItems: number;
  longLeadItems: number;
}

export type AnalysisDimension =
  | "category"
  | "vendor"
  | "leadtime"
  | "procurement";

export interface AnalysisRow {
  key: string;
  lineItems: number;
  totalValue: string;
}

export type BomLineRepoType = {
  create: (data: NewBomLine) => Promise<BomLine | null>;
  findById: (id: string) => Promise<BomLine | null>;
  listByBom: (bomId: string) => Promise<BomLine[]>;
  update: (id: string, data: Partial<NewBomLine>) => Promise<BomLine | null>;
  softDelete: (id: string) => Promise<boolean>;
  maxFindNumber: (bomId: string) => Promise<number>;
  aggregate: (bomId: string, longLeadThreshold: number) => Promise<BomAggregate>;
  analyze: (
    bomId: string,
    dimension: AnalysisDimension
  ) => Promise<AnalysisRow[]>;
};

const create = async (data: NewBomLine): Promise<BomLine | null> => {
  try {
    const [row] = await DB.insert(bomLines).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[BomLine Repo]: error creating line: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<BomLine | null> => {
  try {
    const [row] = await DB
      .select()
      .from(bomLines)
      .where(and(eq(bomLines.id, id), isNull(bomLines.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[BomLine Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const listByBom = async (bomId: string): Promise<BomLine[]> => {
  try {
    return await DB
      .select()
      .from(bomLines)
      .where(and(eq(bomLines.bom_id, bomId), isNull(bomLines.deleted_at)))
      .orderBy(asc(bomLines.find_number));
  } catch (error) {
    logger.error(`[BomLine Repo]: error listing for bom ${bomId}: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewBomLine>
): Promise<BomLine | null> => {
  try {
    const [row] = await DB
      .update(bomLines)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(bomLines.id, id), isNull(bomLines.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[BomLine Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(bomLines)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(bomLines.id, id), isNull(bomLines.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[BomLine Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

const maxFindNumber = async (bomId: string): Promise<number> => {
  try {
    const [row] = await DB
      .select({ max: sql<number>`coalesce(max(${bomLines.find_number}), 0)::int` })
      .from(bomLines)
      .where(and(eq(bomLines.bom_id, bomId), isNull(bomLines.deleted_at)));
    return row?.max ?? 0;
  } catch (error) {
    logger.error(`[BomLine Repo]: error reading max find number: ${error}`);
    throw error;
  }
};

const aggregate = async (
  bomId: string,
  longLeadThreshold: number
): Promise<BomAggregate> => {
  try {
    const [row] = await DB
      .select({
        lineItems: sql<number>`count(*)::int`,
        uniqueMaterials: sql<number>`count(distinct ${bomLines.part_id})::int`,
        totalValue: sql<string>`coalesce(sum(${bomLines.extended_cost}), 0)::text`,
        criticalItems: sql<number>`count(*) filter (where ${bomLines.is_critical})::int`,
        longLeadItems: sql<number>`count(*) filter (where ${bomLines.lead_time_days} > ${longLeadThreshold})::int`,
      })
      .from(bomLines)
      .where(and(eq(bomLines.bom_id, bomId), isNull(bomLines.deleted_at)));
    return {
      lineItems: row?.lineItems ?? 0,
      uniqueMaterials: row?.uniqueMaterials ?? 0,
      totalValue: row?.totalValue ?? "0",
      criticalItems: row?.criticalItems ?? 0,
      longLeadItems: row?.longLeadItems ?? 0,
    };
  } catch (error) {
    logger.error(`[BomLine Repo]: error aggregating ${bomId}: ${error}`);
    throw error;
  }
};

// Regroup a BOM's lines along one dimension with a cost total per group
// (FRD §11 / procedure p6 — "what category takes the most money").
const analyze = async (
  bomId: string,
  dimension: AnalysisDimension
): Promise<AnalysisRow[]> => {
  try {
    const keyExpr: SQL<string> =
      dimension === "category"
        ? sql<string>`coalesce(nullif(${bomLines.category}, ''), 'Uncategorised')`
        : dimension === "procurement"
          ? sql<string>`${bomLines.procurement}::text`
          : dimension === "vendor"
            ? sql<string>`coalesce(${suppliers.name}, 'Unassigned')`
            : sql<string>`case
                when ${bomLines.lead_time_days} <= 7 then 'Short (<=7d)'
                when ${bomLines.lead_time_days} <= 30 then 'Medium (8-30d)'
                else 'Long (>30d)'
              end`;

    const base = DB
      .select({
        key: keyExpr,
        lineItems: sql<number>`count(*)::int`,
        totalValue: sql<string>`coalesce(sum(${bomLines.extended_cost}), 0)::text`,
      })
      .from(bomLines);

    const query =
      dimension === "vendor"
        ? base.leftJoin(suppliers, eq(bomLines.vendor_id, suppliers.id))
        : base;

    const rows = await query
      .where(and(eq(bomLines.bom_id, bomId), isNull(bomLines.deleted_at)))
      .groupBy(keyExpr)
      .orderBy(sql`coalesce(sum(${bomLines.extended_cost}), 0) desc`);

    return rows;
  } catch (error) {
    logger.error(`[BomLine Repo]: error analyzing ${bomId}: ${error}`);
    throw error;
  }
};

export const bomLineRepo: BomLineRepoType = {
  create,
  findById,
  listByBom,
  update,
  softDelete,
  maxFindNumber,
  aggregate,
  analyze,
};
