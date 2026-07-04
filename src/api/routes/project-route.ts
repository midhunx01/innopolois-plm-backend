import { Router } from "express";
import * as projectController from "../controller/project-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

// Projects are created/edited by Engineering (FRD §17); everyone may read.
router.post("/", authorize("Engineering"), projectController.createProject);
router.get("/", projectController.listProjects);
router.get("/:id", projectController.getProject);
// Project coordination: the assigned Project Manager (or Engineering) moves the
// project lifecycle stage. Assignment scope is enforced in the service.
router.patch(
  "/:id/stage",
  authorize("Project Manager", "Engineering"),
  projectController.updateProjectStage
);
router.patch("/:id", authorize("Engineering"), projectController.updateProject);
router.delete("/:id", authorize("Engineering"), projectController.deleteProject);

export const projectRoutes = router;
