import { uuidv7 } from "uuidv7";
import {
  CreateProjectBomDtoType,
  TransitionBomDtoType,
  UpdateProjectBomDtoType,
} from "../api/dto/project-bom-req-dto";
import { BOM_STAGES, BomStage, NewProjectBom, Role } from "../db/schema";
import {
  AnalysisDimension,
  BomAuditRepoType,
  BomLineRepoType,
  CounterRepoType,
  ProjectBomFilters,
  ProjectBomRepoType,
  ProjectRepoType,
} from "../repository";
import {
  AuthorizeError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../util/error";

export interface ProjectBomServiceDeps {
  projectBomRepo: ProjectBomRepoType;
  projectRepo: ProjectRepoType;
  counterRepo: CounterRepoType;
  bomLineRepo: BomLineRepoType;
  bomAuditRepo: BomAuditRepoType;
}

// Material whose lead time exceeds this many days counts as "long-lead".
export const LONG_LEAD_THRESHOLD = 30;

// Who may act at each stage (advance or reject). Administrator always may.
const STAGE_ACTOR: Partial<Record<BomStage, Role[]>> = {
  Draft: ["Engineering"], // submit for technical review
  "Technical Review": ["Engineering"], // technical sign-off
  "Commercial Review": ["Commercial"], // commercial sign-off
  Approved: ["Purchase"], // release for purchase
  // "Released for Purchase" is terminal — no further transitions.
};

const assertActor = (stage: BomStage, role: Role) => {
  if (role === "Administrator") return;
  const allowed = STAGE_ACTOR[stage];
  if (!allowed) {
    throw new ValidationError(`BOM is at a terminal stage (${stage})`);
  }
  if (!allowed.includes(role)) {
    throw new AuthorizeError(
      `Your role (${role}) cannot action a BOM at the "${stage}" stage`
    );
  }
};

/** Recompute and persist the denormalised aggregates for a BOM. */
export const recomputeAggregates = async (
  bomId: string,
  deps: Pick<ProjectBomServiceDeps, "bomLineRepo" | "projectBomRepo">
) => {
  const agg = await deps.bomLineRepo.aggregate(bomId, LONG_LEAD_THRESHOLD);
  await deps.projectBomRepo.update(bomId, {
    line_items: agg.lineItems,
    unique_materials: agg.uniqueMaterials,
    total_value: agg.totalValue,
    critical_items: agg.criticalItems,
    long_lead_items: agg.longLeadItems,
  });
};

const create = async (
  dto: CreateProjectBomDtoType,
  ownerId: string,
  deps: ProjectBomServiceDeps
) => {
  const project = await deps.projectRepo.findById(dto.project_id);
  if (!project) throw new ValidationError("project_id does not exist");

  const seq = await deps.counterRepo.next("bom");
  const number = `BOM-${String(seq).padStart(4, "0")}`;

  const newBom: NewProjectBom = {
    id: uuidv7(),
    number,
    project_id: project.id,
    bom_type: dto.bom_type ?? "Engineering",
    stage: "Draft",
    revision: dto.revision ?? "A",
    owner_id: ownerId,
  };

  const created = await deps.projectBomRepo.create(newBom);
  if (!created) throw new ValidationError("Failed to create BOM");
  return created;
};

const list = async (
  filters: ProjectBomFilters,
  repo: ProjectBomRepoType
) => repo.list(filters);

const getById = async (id: string, repo: ProjectBomRepoType) => {
  const bom = await repo.findById(id);
  if (!bom) throw new NotFoundError("BOM not found");
  return bom;
};

/** Detail view: BOM + its lines + full approval audit trail. */
const getDetail = async (id: string, deps: ProjectBomServiceDeps) => {
  const bom = await deps.projectBomRepo.findById(id);
  if (!bom) throw new NotFoundError("BOM not found");
  const [lines, audit] = await Promise.all([
    deps.bomLineRepo.listByBom(id),
    deps.bomAuditRepo.listByBom(id),
  ]);
  return { ...bom, lines, audit };
};

const update = async (
  id: string,
  dto: UpdateProjectBomDtoType,
  repo: ProjectBomRepoType
) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("BOM not found");
  if (existing.stage === "Released for Purchase") {
    throw new ValidationError("A released BOM cannot be edited");
  }
  const updated = await repo.update(id, { ...dto });
  if (!updated) throw new ValidationError("Failed to update BOM");
  return updated;
};

/** Move a BOM through the approval workflow (FRD §10) with an audit record. */
const transition = async (
  id: string,
  dto: TransitionBomDtoType,
  user: { id: string; role: Role },
  deps: ProjectBomServiceDeps
) => {
  const bom = await deps.projectBomRepo.findById(id);
  if (!bom) throw new NotFoundError("BOM not found");

  const current = bom.stage;
  assertActor(current, user.role);

  let nextStage: BomStage;
  if (dto.action === "advance") {
    const idx = BOM_STAGES.indexOf(current);
    if (idx === BOM_STAGES.length - 1) {
      throw new ValidationError("BOM is already at the final stage");
    }
    // Don't let an empty BOM leave Draft.
    if (current === "Draft" && bom.line_items < 1) {
      throw new ValidationError("Cannot submit a BOM with no line items");
    }
    nextStage = BOM_STAGES[idx + 1];
  } else {
    // reject — send back to Draft for rework.
    if (current === "Draft") {
      throw new ValidationError("A Draft BOM cannot be rejected");
    }
    nextStage = "Draft";
  }

  const updated = await deps.projectBomRepo.update(id, { stage: nextStage });
  if (!updated) throw new ValidationError("Failed to transition BOM");

  await deps.bomAuditRepo.create({
    id: uuidv7(),
    bom_id: id,
    from_stage: current,
    to_stage: nextStage,
    action: dto.action,
    comment: dto.comment ?? "",
    user_id: user.id,
  });

  const audit = await deps.bomAuditRepo.listByBom(id);
  return { ...updated, audit };
};

// Regroup a BOM by a dimension with cost totals + share (FRD §11, procedure p6).
const analyze = async (
  id: string,
  dimension: AnalysisDimension,
  deps: Pick<ProjectBomServiceDeps, "projectBomRepo" | "bomLineRepo">
) => {
  const bom = await deps.projectBomRepo.findById(id);
  if (!bom) throw new NotFoundError("BOM not found");

  const rows = await deps.bomLineRepo.analyze(id, dimension);
  const total = rows.reduce((s, r) => s + Number(r.totalValue), 0);
  const groups = rows.map((r) => ({
    key: r.key,
    lineItems: r.lineItems,
    totalValue: r.totalValue,
    pctOfTotal:
      total > 0 ? Math.round((Number(r.totalValue) / total) * 10000) / 100 : 0,
  }));
  return { bomId: id, dimension, total: total.toFixed(2), groups };
};

const remove = async (
  id: string,
  user: { role: Role },
  deps: ProjectBomServiceDeps
) => {
  const bom = await deps.projectBomRepo.findById(id);
  if (!bom) throw new NotFoundError("BOM not found");
  // Only Draft BOMs can be deleted (Administrator may override).
  if (bom.stage !== "Draft" && user.role !== "Administrator") {
    throw new ConflictError(
      "Only Draft BOMs can be deleted; this one is past Draft"
    );
  }
  const ok = await deps.projectBomRepo.softDelete(id);
  if (!ok) throw new NotFoundError("BOM not found");
  return { message: "BOM deleted successfully" };
};

export const projectBomService = {
  create,
  list,
  getById,
  getDetail,
  update,
  transition,
  analyze,
  remove,
};
