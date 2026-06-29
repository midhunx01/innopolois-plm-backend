import { Static, Type } from "@sinclair/typebox";

export const CreateSubtypeDto = Type.Object(
  {
    category_id: Type.String({
      format: "uuid",
      errorMessage: { format: "category_id must be a UUID" },
    }),
    name: Type.String({
      minLength: 1,
      maxLength: 80,
      errorMessage: {
        type: "name must be a string",
        minLength: "name is required",
        maxLength: "name must be at most 80 characters",
      },
    }),
    code: Type.String({
      minLength: 1,
      maxLength: 4,
      errorMessage: {
        type: "code must be a string",
        minLength: "code is required",
        maxLength: "code must be at most 4 characters",
      },
    }),
    is_active: Type.Optional(Type.Boolean()),
  },
  {
    additionalProperties: false,
    required: ["category_id", "name", "code"],
    errorMessage: {
      required: {
        category_id: "category_id is required",
        name: "name is required",
        code: "code is required",
      },
      additionalProperties: "Unexpected fields in create-subtype request",
    },
  }
);

// category_id cannot be changed on update (it's part of the identity).
export const UpdateSubtypeDto = Type.Partial(
  Type.Omit(CreateSubtypeDto, ["category_id"]),
  {
    additionalProperties: false,
    errorMessage: {
      additionalProperties: "Unexpected fields in update-subtype request",
    },
  }
);

export type CreateSubtypeDtoType = Static<typeof CreateSubtypeDto>;
export type UpdateSubtypeDtoType = Static<typeof UpdateSubtypeDto>;
