import { Static, Type } from "@sinclair/typebox";

export const CreateUnitDto = Type.Object(
  {
    code: Type.String({
      minLength: 1,
      maxLength: 16,
      errorMessage: {
        type: "code must be a string",
        minLength: "code is required",
        maxLength: "code must be at most 16 characters",
      },
    }),
    name: Type.String({
      minLength: 1,
      maxLength: 60,
      errorMessage: {
        type: "name must be a string",
        minLength: "name is required",
        maxLength: "name must be at most 60 characters",
      },
    }),
    is_active: Type.Optional(Type.Boolean()),
  },
  {
    additionalProperties: false,
    required: ["code", "name"],
    errorMessage: {
      required: { code: "code is required", name: "name is required" },
      additionalProperties: "Unexpected fields in create-unit request",
    },
  }
);

export const UpdateUnitDto = Type.Partial(CreateUnitDto, {
  additionalProperties: false,
  errorMessage: {
    additionalProperties: "Unexpected fields in update-unit request",
  },
});

export type CreateUnitDtoType = Static<typeof CreateUnitDto>;
export type UpdateUnitDtoType = Static<typeof UpdateUnitDto>;
