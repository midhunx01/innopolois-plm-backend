import { Static, Type } from "@sinclair/typebox";

const RfqMode = Type.Union(
  [
    Type.Literal("Vendor-wise"),
    Type.Literal("Category-wise"),
    Type.Literal("Package-wise"),
    Type.Literal("Single Item"),
    Type.Literal("Bulk"),
  ],
  { errorMessage: { type: "mode is invalid" } }
);

const RfqLineInput = Type.Object(
  {
    part_id: Type.String({ format: "uuid", errorMessage: { format: "part_id must be a UUID" } }),
    quantity: Type.Number({
      exclusiveMinimum: 0,
      errorMessage: { exclusiveMinimum: "quantity must be greater than zero" },
    }),
    specification: Type.Optional(Type.String({ maxLength: 2000 })),
    buying_notes: Type.Optional(Type.String({ maxLength: 1000 })),
  },
  { additionalProperties: false }
);

// Provide `from_bom_id` to copy the released BOM's lines, OR `lines` to specify
// items explicitly. `vendor_ids` are the invited vendors.
export const CreateRfqDto = Type.Object(
  {
    title: Type.String({
      minLength: 1,
      maxLength: 200,
      errorMessage: { minLength: "title is required", maxLength: "title too long" },
    }),
    mode: Type.Optional(RfqMode),
    project_id: Type.Optional(
      Type.String({ format: "uuid", errorMessage: { format: "project_id must be a UUID" } })
    ),
    from_bom_id: Type.Optional(
      Type.String({ format: "uuid", errorMessage: { format: "from_bom_id must be a UUID" } })
    ),
    category: Type.Optional(Type.String({ maxLength: 80 })),
    vendor_ids: Type.Array(
      Type.String({ format: "uuid", errorMessage: { format: "vendor_ids must be UUIDs" } }),
      { minItems: 1, errorMessage: { minItems: "at least one vendor is required" } }
    ),
    required_date: Type.Optional(Type.String({ format: "date-time" })),
    lines: Type.Optional(Type.Array(RfqLineInput)),
  },
  {
    additionalProperties: false,
    required: ["title", "vendor_ids"],
    errorMessage: {
      required: { title: "title is required", vendor_ids: "vendor_ids is required" },
      additionalProperties: "Unexpected fields in create-rfq request",
    },
  }
);

export const UpdateRfqDto = Type.Object(
  {
    title: Type.Optional(Type.String({ maxLength: 200 })),
    mode: Type.Optional(RfqMode),
    category: Type.Optional(Type.String({ maxLength: 80 })),
    required_date: Type.Optional(Type.String({ format: "date-time" })),
  },
  {
    additionalProperties: false,
    errorMessage: { additionalProperties: "Unexpected fields in update-rfq request" },
  }
);

export type CreateRfqDtoType = Static<typeof CreateRfqDto>;
export type UpdateRfqDtoType = Static<typeof UpdateRfqDto>;
