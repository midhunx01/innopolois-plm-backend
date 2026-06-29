import { Static, Type } from "@sinclair/typebox";

const Direction = Type.Union([Type.Literal("in"), Type.Literal("out")], {
  errorMessage: { type: "direction must be 'in' or 'out'" },
});

// Opening stock for a material at a warehouse (FRD §14).
export const OpeningStockDto = Type.Object(
  {
    part_id: Type.String({ format: "uuid", errorMessage: { format: "part_id must be a UUID" } }),
    warehouse_id: Type.String({
      format: "uuid",
      errorMessage: { format: "warehouse_id must be a UUID" },
    }),
    quantity: Type.Number({
      exclusiveMinimum: 0,
      errorMessage: { exclusiveMinimum: "quantity must be greater than zero" },
    }),
    unit_cost: Type.Optional(Type.Number({ minimum: 0 })),
    reorder_point: Type.Optional(Type.Number({ minimum: 0 })),
    batch: Type.Optional(Type.String({ maxLength: 60 })),
    note: Type.Optional(Type.String({ maxLength: 1000 })),
  },
  {
    additionalProperties: false,
    required: ["part_id", "warehouse_id", "quantity"],
    errorMessage: {
      required: {
        part_id: "part_id is required",
        warehouse_id: "warehouse_id is required",
        quantity: "quantity is required",
      },
      additionalProperties: "Unexpected fields in opening-stock request",
    },
  }
);

// Manual adjustment (in/out) — wastage, spoilage, correction.
export const AdjustStockDto = Type.Object(
  {
    part_id: Type.String({ format: "uuid", errorMessage: { format: "part_id must be a UUID" } }),
    warehouse_id: Type.String({
      format: "uuid",
      errorMessage: { format: "warehouse_id must be a UUID" },
    }),
    direction: Direction,
    quantity: Type.Number({
      exclusiveMinimum: 0,
      errorMessage: { exclusiveMinimum: "quantity must be greater than zero" },
    }),
    wastage: Type.Optional(Type.Boolean()), // true → records as wastage
    note: Type.Optional(Type.String({ maxLength: 1000 })),
  },
  {
    additionalProperties: false,
    required: ["part_id", "warehouse_id", "direction", "quantity"],
    errorMessage: {
      required: {
        part_id: "part_id is required",
        warehouse_id: "warehouse_id is required",
        direction: "direction is required",
        quantity: "quantity is required",
      },
      additionalProperties: "Unexpected fields in adjust-stock request",
    },
  }
);

// Move stock between two warehouses.
export const TransferStockDto = Type.Object(
  {
    part_id: Type.String({ format: "uuid", errorMessage: { format: "part_id must be a UUID" } }),
    from_warehouse_id: Type.String({
      format: "uuid",
      errorMessage: { format: "from_warehouse_id must be a UUID" },
    }),
    to_warehouse_id: Type.String({
      format: "uuid",
      errorMessage: { format: "to_warehouse_id must be a UUID" },
    }),
    quantity: Type.Number({
      exclusiveMinimum: 0,
      errorMessage: { exclusiveMinimum: "quantity must be greater than zero" },
    }),
    note: Type.Optional(Type.String({ maxLength: 1000 })),
  },
  {
    additionalProperties: false,
    required: ["part_id", "from_warehouse_id", "to_warehouse_id", "quantity"],
    errorMessage: {
      required: {
        part_id: "part_id is required",
        from_warehouse_id: "from_warehouse_id is required",
        to_warehouse_id: "to_warehouse_id is required",
        quantity: "quantity is required",
      },
      additionalProperties: "Unexpected fields in transfer-stock request",
    },
  }
);

export type OpeningStockDtoType = Static<typeof OpeningStockDto>;
export type AdjustStockDtoType = Static<typeof AdjustStockDto>;
export type TransferStockDtoType = Static<typeof TransferStockDto>;
