import { Static, Type } from "@sinclair/typebox";

export const LoginDto = Type.Object(
  {
    email: Type.String({
      format: "email",
      errorMessage: { type: "email must be a string", format: "email must be valid" },
    }),
    password: Type.String({
      minLength: 1,
      errorMessage: { type: "password must be a string", minLength: "password is required" },
    }),
  },
  {
    additionalProperties: false,
    required: ["email", "password"],
    errorMessage: {
      required: { email: "email is required", password: "password is required" },
      additionalProperties: "Unexpected fields in login request",
    },
  }
);

export type LoginDtoType = Static<typeof LoginDto>;
