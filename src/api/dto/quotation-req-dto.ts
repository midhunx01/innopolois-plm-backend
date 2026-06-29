import { Static, Type } from "@sinclair/typebox";

const QuotationLineInput = Type.Object(
  {
    rfq_line_id: Type.String({
      format: "uuid",
      errorMessage: { format: "rfq_line_id must be a UUID" },
    }),
    unit_price: Type.Number({
      minimum: 0,
      errorMessage: { type: "unit_price must be a number", minimum: "unit_price must be >= 0" },
    }),
    lead_time_days: Type.Optional(Type.Integer({ minimum: 0 })),
    remarks: Type.Optional(Type.String({ maxLength: 1000 })),
  },
  { additionalProperties: false }
);

// Records a vendor's quotation against an RFQ. One quotation per vendor per RFQ;
// totals are computed from the lines server-side.
export const CreateQuotationDto = Type.Object(
  {
    vendor_id: Type.String({
      format: "uuid",
      errorMessage: { format: "vendor_id must be a UUID" },
    }),
    lead_time_days: Type.Optional(Type.Integer({ minimum: 0 })),
    payment_terms: Type.Optional(Type.String({ maxLength: 80 })),
    validity_days: Type.Optional(Type.Integer({ minimum: 0 })),
    delivery_terms: Type.Optional(Type.String({ maxLength: 120 })),
    lines: Type.Array(QuotationLineInput, {
      minItems: 1,
      errorMessage: { minItems: "at least one quoted line is required" },
    }),
  },
  {
    additionalProperties: false,
    required: ["vendor_id", "lines"],
    errorMessage: {
      required: { vendor_id: "vendor_id is required", lines: "lines is required" },
      additionalProperties: "Unexpected fields in create-quotation request",
    },
  }
);

export type CreateQuotationDtoType = Static<typeof CreateQuotationDto>;
