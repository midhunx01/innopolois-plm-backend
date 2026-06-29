import { Static, Type } from "@sinclair/typebox";

const Priority = Type.Union(
  [
    Type.Literal("Low"),
    Type.Literal("Medium"),
    Type.Literal("High"),
    Type.Literal("Critical"),
  ],
  { errorMessage: { type: "priority is invalid" } }
);

const PoLineInput = Type.Object(
  {
    part_id: Type.String({ format: "uuid", errorMessage: { format: "part_id must be a UUID" } }),
    quantity: Type.Number({
      exclusiveMinimum: 0,
      errorMessage: { exclusiveMinimum: "quantity must be greater than zero" },
    }),
    unit_price: Type.Number({
      minimum: 0,
      errorMessage: { minimum: "unit_price must be >= 0" },
    }),
  },
  { additionalProperties: false }
);

// Raise a PO from an awarded quotation (`from_quotation_id`) OR manually
// (supplier_id + lines).
export const CreatePoDto = Type.Object(
  {
    from_quotation_id: Type.Optional(
      Type.String({ format: "uuid", errorMessage: { format: "from_quotation_id must be a UUID" } })
    ),
    supplier_id: Type.Optional(
      Type.String({ format: "uuid", errorMessage: { format: "supplier_id must be a UUID" } })
    ),
    project_id: Type.Optional(
      Type.String({ format: "uuid", errorMessage: { format: "project_id must be a UUID" } })
    ),
    priority: Type.Optional(Priority),
    expected_date: Type.Optional(Type.String({ format: "date-time" })),
    lines: Type.Optional(Type.Array(PoLineInput)),
  },
  {
    additionalProperties: false,
    errorMessage: {
      additionalProperties: "Unexpected fields in create-po request",
    },
  }
);

const PoStatus = Type.Union(
  [
    Type.Literal("Draft"),
    Type.Literal("Pending Approval"),
    Type.Literal("Open"),
    Type.Literal("Partially Received"),
    Type.Literal("Received"),
    Type.Literal("Closed"),
    Type.Literal("Cancelled"),
  ],
  { errorMessage: { type: "status is invalid" } }
);

export const UpdatePoStatusDto = Type.Object(
  {
    status: PoStatus,
  },
  {
    additionalProperties: false,
    required: ["status"],
    errorMessage: {
      required: { status: "status is required" },
      additionalProperties: "Unexpected fields in update-status request",
    },
  }
);

export const ReceivePoDto = Type.Object(
  {
    lines: Type.Array(
      Type.Object(
        {
          po_line_id: Type.String({
            format: "uuid",
            errorMessage: { format: "po_line_id must be a UUID" },
          }),
          received_qty: Type.Number({
            minimum: 0,
            errorMessage: { minimum: "received_qty must be >= 0" },
          }),
        },
        { additionalProperties: false }
      ),
      { minItems: 1, errorMessage: { minItems: "at least one line is required" } }
    ),
  },
  {
    additionalProperties: false,
    required: ["lines"],
    errorMessage: {
      required: { lines: "lines is required" },
      additionalProperties: "Unexpected fields in receive request",
    },
  }
);

export type CreatePoDtoType = Static<typeof CreatePoDto>;
export type UpdatePoStatusDtoType = Static<typeof UpdatePoStatusDto>;
export type ReceivePoDtoType = Static<typeof ReceivePoDto>;
