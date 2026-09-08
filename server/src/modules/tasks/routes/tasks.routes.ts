import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { catchAsync } from "../../../utils/catch-async";
import * as controller from "../controllers/tasks.controller";

const router = Router();
router.use(authMiddleware);
router.post("/", catchAsync(controller.createTaskController));
router.get("/", catchAsync(controller.listTasksController));
router.get("/today", catchAsync(controller.getTodayTasksController));
router.get("/:id", catchAsync(controller.getTaskController));
router.put("/:id", catchAsync(controller.updateTaskController));
router.delete("/:id", catchAsync(controller.deleteTaskController));
router.patch("/:id/complete", catchAsync(controller.completeTaskController));

export { router as tasksRouter };
