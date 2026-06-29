import { Static, Type } from "@sinclair/typebox";

export const CreateMajorSpecDto = Type.Object(
  {
    code: Type.String({
      minLength: 1,
      maxLength: 4,
      errorMessage: {
        type: "code must be a string",
        minLength: "code is required",
        maxLength: "code must be at most 4 characters",
      },
    }),
    label: Type.String({
      minLength: 1,
      maxLength: 80,
      errorMessage: {
        type: "label must be a string",
        minLength: "label is required",
        maxLength: "label must be at most 80 characters",
      },
    }),
    is_active: Type.Optional(Type.Boolean()),
  },
  {
    additionalProperties: false,
    required: ["code", "label"],
    errorMessage: {
      required: { code: "code is required", label: "label is required" },
      additionalProperties: "Unexpected fields in create-major-spec request",
    },
  }
);

export const UpdateMajorSpecDto = Type.Partial(CreateMajorSpecDto, {
  additionalProperties: false,
  errorMessage: {
    additionalProperties: "Unexpected fields in update-major-spec request",
  },
});

export type CreateMajorSpecDtoType = Static<typeof CreateMajorSpecDto>;
export type UpdateMajorSpecDtoType = Static<typeof UpdateMajorSpecDto>;
