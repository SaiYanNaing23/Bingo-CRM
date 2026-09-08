import { Router } from "express";

import { catchAsync } from "../../utils/catch-async";
import { healthController } from "./health.controller";

const router = Router();

router.get("/health", catchAsync(healthController));

export { router as healthRouter };
