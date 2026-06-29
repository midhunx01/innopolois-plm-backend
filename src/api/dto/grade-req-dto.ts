import { Static, Type } from "@sinclair/typebox";

export const CreateGradeDto = Type.Object(
  {
    code: Type.String({
      minLength: 1,
      maxLength: 8,
      errorMessage: {
        type: "code must be a string",
        minLength: "code is required",
        maxLength: "code must be at most 8 characters",
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
      additionalProperties: "Unexpected fields in create-grade request",
    },
  }
);

export const UpdateGradeDto = Type.Partial(CreateGradeDto, {
  additionalProperties: false,
  errorMessage: {
    additionalProperties: "Unexpected fields in update-grade request",
  },
});

export type CreateGradeDtoType = Static<typeof CreateGradeDto>;
export type UpdateGradeDtoType = Static<typeof UpdateGradeDto>;
