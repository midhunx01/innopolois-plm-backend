import { Static, Type } from "@sinclair/typebox";

const WarehouseType = Type.Union(
  [
    Type.Literal("Distribution"),
    Type.Literal("Manufacturing"),
    Type.Literal("Buffer"),
    Type.Literal("Transit"),
  ],
  { errorMessage: { type: "type is invalid" } }
);

export const CreateWarehouseDto = Type.Object(
  {
    code: Type.String({
      minLength: 1,
      maxLength: 24,
      errorMessage: { minLength: "code is required", maxLength: "code too long" },
    }),
    name: Type.String({
      minLength: 1,
      maxLength: 120,
      errorMessage: { minLength: "name is required", maxLength: "name too long" },
    }),
    type: Type.Optional(WarehouseType),
    city: Type.Optional(Type.String({ maxLength: 80 })),
    country: Type.Optional(Type.String({ maxLength: 80 })),
    capacity_pct: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
    lat: Type.Optional(Type.Number()),
    lng: Type.Optional(Type.Number()),
  },
  {
    additionalProperties: false,
    required: ["code", "name"],
    errorMessage: {
      required: { code: "code is required", name: "name is required" },
      additionalProperties: "Unexpected fields in create-warehouse request",
    },
  }
);

export const UpdateWarehouseDto = Type.Partial(CreateWarehouseDto, {
  additionalProperties: false,
  errorMessage: {
    additionalProperties: "Unexpected fields in update-warehouse request",
  },
});

export type CreateWarehouseDtoType = Static<typeof CreateWarehouseDto>;
export type UpdateWarehouseDtoType = Static<typeof UpdateWarehouseDto>;
