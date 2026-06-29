import { Static, Type } from "@sinclair/typebox";

// A line snapshots a material; the snapshot fields (part_number, name, uom,
// unit_cost, …) are pulled from the referenced part server-side. The client
// supplies the part reference + line-specific data only.
export const CreateBomLineDto = Type.Object(
  {
    part_id: Type.String({
      format: "uuid",
      errorMessage: { format: "part_id must be a UUID" },
    }),
    quantity: Type.Number({
      exclusiveMinimum: 0,
      errorMessage: {
        type: "quantity must be a number",
        exclusiveMinimum: "quantity must be greater than zero",
      },
    }),
    vendor_id: Type.Optional(
      Type.String({ format: "uuid", errorMessage: { format: "vendor_id must be a UUID" } })
    ),
    ref_designator: Type.Optional(Type.String({ maxLength: 80 })),
    remarks: Type.Optional(Type.String({ maxLength: 1000 })),
    buying_notes: Type.Optional(Type.String({ maxLength: 1000 })),
    drawing_ref: Type.Optional(Type.String({ maxLength: 120 })),
    is_critical: Type.Optional(Type.Boolean()),
    // Optional per-line cost override; defaults to the material's unit cost.
    unit_cost: Type.Optional(Type.Number({ minimum: 0 })),
  },
  {
    additionalProperties: false,
    required: ["part_id", "quantity"],
    errorMessage: {
      required: {
        part_id: "part_id is required",
        quantity: "quantity is required",
      },
      additionalProperties: "Unexpected fields in create-line request",
    },
  }
);

// part_id is immutable on a line (delete + re-add to swap the material).
export const UpdateBomLineDto = Type.Partial(
  Type.Omit(CreateBomLineDto, ["part_id"]),
  {
    additionalProperties: false,
    errorMessage: {
      additionalProperties: "Unexpected fields in update-line request",
    },
  }
);

export type CreateBomLineDtoType = Static<typeof CreateBomLineDto>;
export type UpdateBomLineDtoType = Static<typeof UpdateBomLineDto>;
