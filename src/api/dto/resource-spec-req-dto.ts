import { Static, Type } from "@sinclair/typebox";

export const CreateResourceSpecDto = Type.Object(
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
      maxLength: 120,
      errorMessage: {
        type: "name must be a string",
        minLength: "name is required",
        maxLength: "name must be at most 120 characters",
      },
    }),
    description: Type.Optional(Type.String({ maxLength: 2000 })),
    is_active: Type.Optional(Type.Boolean()),
  },
  {
    additionalProperties: false,
    required: ["code", "name"],
    errorMessage: {
      required: { code: "code is required", name: "name is required" },
      additionalProperties: "Unexpected fields in create-resource-spec request",
    },
  }
);

export const UpdateResourceSpecDto = Type.Partial(CreateResourceSpecDto, {
  additionalProperties: false,
  errorMessage: {
    additionalProperties: "Unexpected fields in update-resource-spec request",
  },
});

export type CreateResourceSpecDtoType = Static<typeof CreateResourceSpecDto>;
export type UpdateResourceSpecDtoType = Static<typeof UpdateResourceSpecDto>;
