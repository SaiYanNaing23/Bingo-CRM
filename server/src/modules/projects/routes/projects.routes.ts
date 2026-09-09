import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { catchAsync } from "../../../utils/catch-async";
import * as controller from "../controllers/projects.controller";

const router = Router();
router.use(authMiddleware);
router.post("/", catchAsync(controller.createProjectController));
router.get("/", catchAsync(controller.listProjectsController));
router.get("/:id", catchAsync(controller.getProjectController));
router.put("/:id", catchAsync(controller.updateProjectController));
router.delete("/:id", catchAsync(controller.deleteProjectController));
router.patch("/:id/progress", catchAsync(controller.updateProjectProgressController));
router.get("/:id/activities", catchAsync(controller.listProjectActivitiesController));
router.post("/:id/activities", catchAsync(controller.createProjectCommentController));

export { router as projectsRouter };
