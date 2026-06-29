import { Router } from "express";
import * as gradeController from "../controller/grade-controller";
import { authenticate, authorize } from "../middlewares";

const router = Router();

router.use(authenticate);

router.post("/", authorize("Administrator"), gradeController.createGrade);
router.get("/", gradeController.listGrades);
router.get("/:id", gradeController.getGrade);
router.patch("/:id", authorize("Administrator"), gradeController.updateGrade);
router.delete("/:id", authorize("Administrator"), gradeController.deleteGrade);

export const gradeRoutes = router;
