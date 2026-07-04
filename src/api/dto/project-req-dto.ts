import { Static, Type } from "@sinclair/typebox";

const ProjectStage = Type.Union(
  [
    Type.Literal("Enquiry"),
    Type.Literal("Technical Evaluation"),
    Type.Literal("Quotation"),
    Type.Literal("Project Order"),
    Type.Literal("Detailed Engineering"),
    Type.Literal("Final BOM"),
    Type.Literal("Purchase Release"),
    Type.Literal("Procurement"),
    Type.Literal("Fulfilment"),
    Type.Literal("Completed"),
  ],
  { errorMessage: { type: "stage is invalid" } }
);

const Lifecycle = Type.Union(
  [
    Type.Literal("Concept"),
    Type.Literal("In Design"),
    Type.Literal("In Review"),
    Type.Literal("Released"),
    Type.Literal("Production"),
    Type.Literal("Obsolete"),
  ],
  { errorMessage: { type: "lifecycle is invalid" } }
);

export const CreateProjectDto = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 200,
      errorMessage: {
        type: "name must be a string",
        minLength: "name is required",
        maxLength: "name must be at most 200 characters",
      },
    }),
    customer: Type.Optional(Type.String({ maxLength: 160 })),
    family: Type.Optional(Type.String({ maxLength: 80 })),
    category: Type.Optional(Type.String({ maxLength: 80 })),
    description: Type.Optional(Type.String({ maxLength: 2000 })),
    engineer_id: Type.Optional(
      Type.String({ format: "uuid", errorMessage: { format: "engineer_id must be a UUID" } })
    ),
    project_manager_id: Type.Optional(
      Type.String({ format: "uuid", errorMessage: { format: "project_manager_id must be a UUID" } })
    ),
    stage: Type.Optional(ProjectStage),
    lifecycle: Type.Optional(Lifecycle),
    revision: Type.Optional(Type.String({ maxLength: 16 })),
    version: Type.Optional(Type.String({ maxLength: 16 })),
    target_cost: Type.Optional(Type.Number({ minimum: 0 })),
    quoted_price: Type.Optional(Type.Number({ minimum: 0 })),
    thumbnail_hue: Type.Optional(Type.Integer({ minimum: 0, maximum: 360 })),
  },
  {
    additionalProperties: false,
    required: ["name"],
    errorMessage: {
      required: { name: "name is required" },
      additionalProperties: "Unexpected fields in create-project request",
    },
  }
);

// project_number is generated server-side; never accepted from the client.
export const UpdateProjectDto = Type.Partial(CreateProjectDto, {
  additionalProperties: false,
  errorMessage: {
    additionalProperties: "Unexpected fields in update-project request",
  },
});

// Dedicated stage-change payload (project coordination — PM / Engineering).
export const UpdateProjectStageDto = Type.Object(
  { stage: ProjectStage },
  {
    additionalProperties: false,
    required: ["stage"],
    errorMessage: {
      required: { stage: "stage is required" },
      additionalProperties: "Unexpected fields in project-stage request",
    },
  }
);

export type CreateProjectDtoType = Static<typeof CreateProjectDto>;
export type UpdateProjectDtoType = Static<typeof UpdateProjectDto>;
export type UpdateProjectStageDtoType = Static<typeof UpdateProjectStageDto>;
