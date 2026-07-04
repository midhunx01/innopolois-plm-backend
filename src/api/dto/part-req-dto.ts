import { Static, Type } from "@sinclair/typebox";

const Lifecycle = Type.Union(
  [
    Type.Literal("Concept"),
    Type.Literal("In Design"),
    Type.Literal("In Review"),
    Type.Literal("Released"),
    Type.Literal("Production"),
    Type.Literal("Obsolete"),
  ],
  { errorMessage: { type: "lifecycle is invalid" } }
);

const Sourcing = Type.Union(
  [Type.Literal("Make"), Type.Literal("Buy"), Type.Literal("Standard")],
  { errorMessage: { type: "sourcing is invalid" } }
);

const Availability = Type.Union(
  [
    Type.Literal("In Stock"),
    Type.Literal("Low Stock"),
    Type.Literal("Backorder"),
    Type.Literal("Out of Stock"),
  ],
  { errorMessage: { type: "availability is invalid" } }
);

// The material code (TT-SS-MM-DDDD) is generated server-side from the selected
// masters, so it is never accepted from the client.
export const CreatePartDto = Type.Object(
  {
    // ── Code composition (references to master tables) ───────────────────────
    category_id: Type.String({
      format: "uuid",
      errorMessage: { format: "category_id must be a UUID" },
    }),
    subtype_id: Type.String({
      format: "uuid",
      errorMessage: { format: "subtype_id must be a UUID" },
    }),
    major_spec_id: Type.Optional(
      Type.String({ format: "uuid", errorMessage: { format: "major_spec_id must be a UUID" } })
    ),
    grade_id: Type.Optional(
      Type.String({ format: "uuid", errorMessage: { format: "grade_id must be a UUID" } })
    ),

    // ── Basic information ────────────────────────────────────────────────────
    name: Type.String({
      minLength: 1,
      maxLength: 160,
      errorMessage: {
        type: "name must be a string",
        minLength: "name is required",
        maxLength: "name must be at most 160 characters",
      },
    }),
    remarks: Type.Optional(Type.String({ maxLength: 2000 })),
    material: Type.Optional(Type.String({ maxLength: 120 })),
    finish: Type.Optional(Type.String({ maxLength: 120 })),
    revision: Type.Optional(Type.String({ maxLength: 16 })),
    lifecycle: Type.Optional(Lifecycle),
    sourcing: Type.Optional(Sourcing),
    weight_kg: Type.Optional(Type.Number({ minimum: 0 })),

    // ── Commercial information ───────────────────────────────────────────────
    unit_cost: Type.Optional(Type.Number({ minimum: 0 })),
    last_purchase_price: Type.Optional(Type.Number({ minimum: 0 })),
    lead_time_days: Type.Optional(Type.Integer({ minimum: 0 })),
    // Preferred vendors (Vendor Master). A material may have several.
    vendor_ids: Type.Optional(
      Type.Array(
        Type.String({
          format: "uuid",
          errorMessage: { format: "each vendor_id must be a UUID" },
        }),
        { errorMessage: { type: "vendor_ids must be an array of UUIDs" } }
      )
    ),
    manufacturer_part_number: Type.Optional(Type.String({ maxLength: 120 })),
    make: Type.Optional(Type.String({ maxLength: 120 })),
    model: Type.Optional(Type.String({ maxLength: 120 })),
    drawing_ref: Type.Optional(Type.String({ maxLength: 120 })),

    // ── Inventory information ────────────────────────────────────────────────
    availability: Type.Optional(Availability),
    stock_qty: Type.Optional(Type.Number({ minimum: 0 })),
    reorder_point: Type.Optional(Type.Number({ minimum: 0 })),
    min_stock: Type.Optional(Type.Number({ minimum: 0 })),
    max_stock: Type.Optional(Type.Number({ minimum: 0 })),
    stock_location: Type.Optional(Type.String({ maxLength: 80 })),
    uom: Type.Optional(Type.String({ maxLength: 16 })),

    // ── Classification ───────────────────────────────────────────────────────
    compliance: Type.Optional(Type.Array(Type.String({ maxLength: 32 }))),
    tags: Type.Optional(Type.Array(Type.String({ maxLength: 40 }))),
    thumbnail_hue: Type.Optional(Type.Integer({ minimum: 0, maximum: 360 })),
  },
  {
    additionalProperties: false,
    required: ["category_id", "subtype_id", "name"],
    errorMessage: {
      required: {
        category_id: "category_id is required",
        subtype_id: "subtype_id is required",
        name: "name is required",
      },
      additionalProperties: "Unexpected fields in create-part request",
    },
  }
);

// Code-composition fields are immutable after creation (they define identity).
export const UpdatePartDto = Type.Partial(
  Type.Omit(CreatePartDto, ["category_id", "subtype_id", "major_spec_id", "grade_id"]),
  {
    additionalProperties: false,
    errorMessage: {
      additionalProperties: "Unexpected fields in update-part request",
    },
  }
);

export type CreatePartDtoType = Static<typeof CreatePartDto>;
export type UpdatePartDtoType = Static<typeof UpdatePartDto>;
