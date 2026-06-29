import { Static, Type } from "@sinclair/typebox";

const BomType = Type.Union(
  [
    Type.Literal("Engineering"),
    Type.Literal("Procurement"),
    Type.Literal("Final Released"),
  ],
  { errorMessage: { type: "bom_type is invalid" } }
);

export const CreateProjectBomDto = Type.Object(
  {
    project_id: Type.String({
      format: "uuid",
      errorMessage: { format: "project_id must be a UUID" },
    }),
    bom_type: Type.Optional(BomType),
    revision: Type.Optional(Type.String({ maxLength: 16 })),
  },
  {
    additionalProperties: false,
    required: ["project_id"],
    errorMessage: {
      required: { project_id: "project_id is required" },
      additionalProperties: "Unexpected fields in create-bom request",
    },
  }
);

// Only metadata is editable directly; stage moves via the transition endpoint.
export const UpdateProjectBomDto = Type.Object(
  {
    bom_type: Type.Optional(BomType),
    revision: Type.Optional(Type.String({ maxLength: 16 })),
  },
  {
    additionalProperties: false,
    errorMessage: {
      additionalProperties: "Unexpected fields in update-bom request",
    },
  }
);

// Workflow transition (FRD §10).
export const TransitionBomDto = Type.Object(
  {
    action: Type.Union([Type.Literal("advance"), Type.Literal("reject")], {
      errorMessage: { type: "action must be 'advance' or 'reject'" },
    }),
    comment: Type.Optional(Type.String({ maxLength: 1000 })),
  },
  {
    additionalProperties: false,
    required: ["action"],
    errorMessage: {
      required: { action: "action is required" },
      additionalProperties: "Unexpected fields in transition request",
    },
  }
);

export type CreateProjectBomDtoType = Static<typeof CreateProjectBomDto>;
export type UpdateProjectBomDtoType = Static<typeof UpdateProjectBomDto>;
export type TransitionBomDtoType = Static<typeof TransitionBomDto>;
