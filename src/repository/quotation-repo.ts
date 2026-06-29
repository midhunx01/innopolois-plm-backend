import { and, asc, eq, isNull } from "drizzle-orm";
import { DB } from "../db/db-connection";
import { NewQuotation, Quotation, quotations } from "../db/schema";
import { logger } from "../util";

export type QuotationRepoType = {
  create: (data: NewQuotation) => Promise<Quotation | null>;
  findById: (id: string) => Promise<Quotation | null>;
  findByRfqAndVendor: (
    rfqId: string,
    vendorId: string
  ) => Promise<Quotation | null>;
  listByRfq: (rfqId: string) => Promise<Quotation[]>;
  update: (id: string, data: Partial<NewQuotation>) => Promise<Quotation | null>;
  softDelete: (id: string) => Promise<boolean>;
};

const create = async (data: NewQuotation): Promise<Quotation | null> => {
  try {
    const [row] = await DB.insert(quotations).values(data).returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Quotation Repo]: error creating: ${error}`);
    throw error;
  }
};

const findById = async (id: string): Promise<Quotation | null> => {
  try {
    const [row] = await DB
      .select()
      .from(quotations)
      .where(and(eq(quotations.id, id), isNull(quotations.deleted_at)))
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Quotation Repo]: error finding ${id}: ${error}`);
    throw error;
  }
};

const findByRfqAndVendor = async (
  rfqId: string,
  vendorId: string
): Promise<Quotation | null> => {
  try {
    const [row] = await DB
      .select()
      .from(quotations)
      .where(
        and(
          eq(quotations.rfq_id, rfqId),
          eq(quotations.vendor_id, vendorId),
          isNull(quotations.deleted_at)
        )
      )
      .limit(1);
    return row ?? null;
  } catch (error) {
    logger.error(`[Quotation Repo]: error finding by rfq+vendor: ${error}`);
    throw error;
  }
};

const listByRfq = async (rfqId: string): Promise<Quotation[]> => {
  try {
    return await DB
      .select()
      .from(quotations)
      .where(and(eq(quotations.rfq_id, rfqId), isNull(quotations.deleted_at)))
      .orderBy(asc(quotations.total_value));
  } catch (error) {
    logger.error(`[Quotation Repo]: error listing for ${rfqId}: ${error}`);
    throw error;
  }
};

const update = async (
  id: string,
  data: Partial<NewQuotation>
): Promise<Quotation | null> => {
  try {
    const [row] = await DB
      .update(quotations)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(quotations.id, id), isNull(quotations.deleted_at)))
      .returning();
    return row ?? null;
  } catch (error) {
    logger.error(`[Quotation Repo]: error updating ${id}: ${error}`);
    throw error;
  }
};

const softDelete = async (id: string): Promise<boolean> => {
  try {
    const rows = await DB
      .update(quotations)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(quotations.id, id), isNull(quotations.deleted_at)))
      .returning();
    return rows.length > 0;
  } catch (error) {
    logger.error(`[Quotation Repo]: error deleting ${id}: ${error}`);
    throw error;
  }
};

export const quotationRepo: QuotationRepoType = {
  create,
  findById,
  findByRfqAndVendor,
  listByRfq,
  update,
  softDelete,
};
