import { Router } from "express";

import { catchAsync } from "../../utils/catch-async";
import { healthController, readinessController } from "./health.controller";

const router = Router();

router.get("/health", catchAsync(healthController));
router.get("/health/ready", catchAsync(readinessController));

export { router as healthRouter };
