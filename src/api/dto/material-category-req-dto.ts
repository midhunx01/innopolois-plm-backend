import { Static, Type } from "@sinclair/typebox";

export const CreateMaterialCategoryDto = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 80,
      errorMessage: {
        type: "name must be a string",
        minLength: "name is required",
        maxLength: "name must be at most 80 characters",
      },
    }),
    type_code: Type.String({
      minLength: 1,
      maxLength: 4,
      errorMessage: {
        type: "type_code must be a string",
        minLength: "type_code is required",
        maxLength: "type_code must be at most 4 characters",
      },
    }),
    default_uom: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 16,
        errorMessage: { maxLength: "default_uom must be at most 16 characters" },
      })
    ),
    is_active: Type.Optional(Type.Boolean()),
  },
  {
    additionalProperties: false,
    required: ["name", "type_code"],
    errorMessage: {
      required: {
        name: "name is required",
        type_code: "type_code is required",
      },
      additionalProperties: "Unexpected fields in create-category request",
    },
  }
);

export const UpdateMaterialCategoryDto = Type.Partial(CreateMaterialCategoryDto, {
  additionalProperties: false,
  errorMessage: {
    additionalProperties: "Unexpected fields in update-category request",
  },
});

export type CreateMaterialCategoryDtoType = Static<typeof CreateMaterialCategoryDto>;
export type UpdateMaterialCategoryDtoType = Static<typeof UpdateMaterialCategoryDto>;
