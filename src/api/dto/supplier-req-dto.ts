import { Static, Type } from "@sinclair/typebox";

const SupplierStatus = Type.Union(
  [
    Type.Literal("Approved"),
    Type.Literal("Preferred"),
    Type.Literal("Conditional"),
    Type.Literal("Under Review"),
  ],
  { errorMessage: { type: "status is invalid" } }
);

export const CreateSupplierDto = Type.Object(
  {
    code: Type.String({
      minLength: 1,
      maxLength: 24,
      errorMessage: {
        type: "code must be a string",
        minLength: "code is required",
        maxLength: "code must be at most 24 characters",
      },
    }),
    name: Type.String({
      minLength: 1,
      maxLength: 160,
      errorMessage: {
        type: "name must be a string",
        minLength: "name is required",
        maxLength: "name must be at most 160 characters",
      },
    }),

    // Classification
    country: Type.Optional(Type.String({ maxLength: 80 })),
    region: Type.Optional(Type.String({ maxLength: 40 })),
    category: Type.Optional(Type.String({ maxLength: 80 })),
    categories_supplied: Type.Optional(Type.Array(Type.String({ maxLength: 80 }))),
    tier: Type.Optional(
      Type.Integer({
        minimum: 1,
        maximum: 3,
        errorMessage: { minimum: "tier must be 1-3", maximum: "tier must be 1-3" },
      })
    ),

    // Contact
    contact: Type.Optional(Type.String({ maxLength: 120 })),
    email: Type.Optional(Type.String({ maxLength: 254 })),
    phone: Type.Optional(Type.String({ maxLength: 40 })),
    address: Type.Optional(Type.String({ maxLength: 1000 })),
    gst_vat: Type.Optional(Type.String({ maxLength: 40 })),

    // Commercial terms
    payment_terms: Type.Optional(Type.String({ maxLength: 80 })),
    lead_time_avg: Type.Optional(Type.Integer({ minimum: 0 })),

    // Performance metrics
    rating: Type.Optional(Type.Number({ minimum: 0, maximum: 5 })),
    on_time_pct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
    quality_pct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
    risk_score: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
    parts_supplied: Type.Optional(Type.Integer({ minimum: 0 })),
    open_pos: Type.Optional(Type.Integer({ minimum: 0 })),
    annual_spend: Type.Optional(Type.Number({ minimum: 0 })),

    // Status
    status: Type.Optional(SupplierStatus),
    approved: Type.Optional(Type.Boolean()),
  },
  {
    additionalProperties: false,
    required: ["code", "name"],
    errorMessage: {
      required: { code: "code is required", name: "name is required" },
      additionalProperties: "Unexpected fields in create-vendor request",
    },
  }
);

export const UpdateSupplierDto = Type.Partial(CreateSupplierDto, {
  additionalProperties: false,
  errorMessage: {
    additionalProperties: "Unexpected fields in update-vendor request",
  },
});

export type CreateSupplierDtoType = Static<typeof CreateSupplierDto>;
export type UpdateSupplierDtoType = Static<typeof UpdateSupplierDto>;
