import { asc, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { DB } from "../db/db-connection";
import {
  GoodsReceipt,
  GoodsReceiptLine,
  NewGoodsReceipt,
  NewGoodsReceiptLine,
  goodsReceiptLines,
  goodsReceipts,
  users,
} from "../db/schema";
import { logger } from "../util";

// A GRN with its actor's display fields and its line detail.
export type GoodsReceiptWithLines = GoodsReceipt & {
  received_by_name: string | null;
  received_by_initials: string | null;
  received_by_hue: number | null;
  lines: GoodsReceiptLine[];
};

export type GoodsReceiptRepoType = {
  create: (data: NewGoodsReceipt) => Promise<GoodsReceipt | null>;
  createLines: (data: NewGoodsReceiptLine[]) => Promise<GoodsReceiptLine[]>;
  listByPo: (poId: string) => Promise<GoodsReceiptWithLines[]>;
};

const create = async (data: NewGoodsReceipt): Promise<GoodsReceipt | null> => {
  try {
    const [row] = await DB.insert(goodsReceipts).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[GoodsReceipt Repo]: error creating: ${error}`);
    throw error;
  }
};

const createLines = async (
  data: NewGoodsReceiptLine[]
): Promise<GoodsReceiptLine[]> => {
  try {
    if (data.length === 0) return [];
    return await DB.insert(goodsReceiptLines).values(data).returning();
  } catch (error) {
    logger.error(`[GoodsReceipt Repo]: error creating lines: ${error}`);
    throw error;
  }
};

const listByPo = async (poId: string): Promise<GoodsReceiptWithLines[]> => {
  try {
    const receipts = await DB.select({
      ...getTableColumns(goodsReceipts),
      received_by_name: users.name,
      received_by_initials: users.initials,
      received_by_hue: users.hue,
    })
      .from(goodsReceipts)
      .leftJoin(users, eq(users.id, goodsReceipts.received_by))
      .where(eq(goodsReceipts.po_id, poId))
      .orderBy(desc(goodsReceipts.received_at));

    if (receipts.length === 0) return [];

    const receiptIds = receipts.map((r) => r.id);
    const lines = await DB.select()
      .from(goodsReceiptLines)
      .where(inArray(goodsReceiptLines.receipt_id, receiptIds))
      .orderBy(asc(goodsReceiptLines.created_at));

    return receipts.map((r) => ({
      ...r,
      lines: lines.filter((l) => l.receipt_id === r.id),
    }));
  } catch (error) {
    logger.error(`[GoodsReceipt Repo]: error listing for PO ${poId}: ${error}`);
    throw error;
  }
};

export const goodsReceiptRepo: GoodsReceiptRepoType = {
  create,
  createLines,
  listByPo,
};
