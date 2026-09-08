import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { catchAsync } from "../../../utils/catch-async";
import * as controller from "../controllers/applications.controller";

const router = Router();
router.use(authMiddleware);
router.post("/", catchAsync(controller.createApplicationController));
router.get("/", catchAsync(controller.listApplicationsController));
router.get("/:id", catchAsync(controller.getApplicationController));
router.put("/:id", catchAsync(controller.updateApplicationController));
router.delete("/:id", catchAsync(controller.deleteApplicationController));
router.patch("/:id/stage", catchAsync(controller.transitionApplicationStageController));
router.get("/:id/stage-history", catchAsync(controller.listApplicationStageHistoryController));

export { router as applicationsRouter };
