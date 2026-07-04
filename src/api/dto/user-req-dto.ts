import { Static, Type } from "@sinclair/typebox";

const Role = Type.Union(
  [
    Type.Literal("Administrator"),
    Type.Literal("Engineering"),
    Type.Literal("Commercial"),
    Type.Literal("Purchase"),
    Type.Literal("Stores"),
    Type.Literal("Management"),
    Type.Literal("Project Manager"),
  ],
  { errorMessage: { type: "role is invalid" } }
);

export const CreateUserDto = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 120,
      errorMessage: { minLength: "name is required", maxLength: "name too long" },
    }),
    email: Type.String({
      format: "email",
      maxLength: 254,
      errorMessage: { format: "email must be valid" },
    }),
    password: Type.String({
      minLength: 6,
      maxLength: 128,
      errorMessage: {
        minLength: "password must be at least 6 characters",
        maxLength: "password too long",
      },
    }),
    role: Role,
    team: Type.Optional(Type.String({ maxLength: 80 })),
    initials: Type.Optional(Type.String({ maxLength: 4 })),
    hue: Type.Optional(Type.Integer({ minimum: 0, maximum: 360 })),
  },
  {
    additionalProperties: false,
    required: ["name", "email", "password", "role"],
    errorMessage: {
      required: {
        name: "name is required",
        email: "email is required",
        password: "password is required",
        role: "role is required",
      },
      additionalProperties: "Unexpected fields in create-user request",
    },
  }
);

// Profile fields only — passwords are never set here. Admins reset passwords
// via POST /api/users/:id/reset-password (temporary password + forced change).
export const UpdateUserDto = Type.Object(
  {
    name: Type.Optional(Type.String({ minLength: 1, maxLength: 120 })),
    email: Type.Optional(Type.String({ format: "email", maxLength: 254 })),
    role: Type.Optional(Role),
    team: Type.Optional(Type.String({ maxLength: 80 })),
    initials: Type.Optional(Type.String({ maxLength: 4 })),
    hue: Type.Optional(Type.Integer({ minimum: 0, maximum: 360 })),
    is_active: Type.Optional(Type.Boolean()),
  },
  {
    additionalProperties: false,
    errorMessage: {
      additionalProperties: "Unexpected fields in update-user request",
    },
  }
);

// Administrator reset. Omit temporary_password to have one generated & returned.
export const ResetPasswordDto = Type.Object(
  {
    temporary_password: Type.Optional(
      Type.String({
        minLength: 6,
        maxLength: 128,
        errorMessage: {
          minLength: "temporary_password must be at least 6 characters",
        },
      })
    ),
  },
  {
    additionalProperties: false,
    errorMessage: {
      additionalProperties: "Unexpected fields in reset-password request",
    },
  }
);

// Forced first-login change: supply the temporary password + the new one.
export const SetPasswordDto = Type.Object(
  {
    current_password: Type.String({
      minLength: 1,
      errorMessage: { minLength: "current_password is required" },
    }),
    new_password: Type.String({
      minLength: 6,
      maxLength: 128,
      errorMessage: { minLength: "new_password must be at least 6 characters" },
    }),
  },
  {
    additionalProperties: false,
    required: ["current_password", "new_password"],
    errorMessage: {
      required: {
        current_password: "current_password is required",
        new_password: "new_password is required",
      },
      additionalProperties: "Unexpected fields in set-password request",
    },
  }
);

export type CreateUserDtoType = Static<typeof CreateUserDto>;
export type UpdateUserDtoType = Static<typeof UpdateUserDto>;
export type ResetPasswordDtoType = Static<typeof ResetPasswordDto>;
export type SetPasswordDtoType = Static<typeof SetPasswordDto>;
