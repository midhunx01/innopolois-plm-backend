import { Static, Type } from "@sinclair/typebox";

export const UuidString = Type.String({
  format: "uuid",
  errorMessage: {
    type: "Value must be a string",
    format: "Value must be a valid UUID",
  },
});

export const EmailString = Type.String({
  format: "email",
  minLength: 5,
  maxLength: 254,
  errorMessage: {
    type: "Value must be a string",
    format: "Value must be a valid email address",
    minLength: "Email must not be empty",
    maxLength: "Email is too long",
  },
});

export type UuidStringType = Static<typeof UuidString>;
export type EmailStringType = Static<typeof EmailString>;
