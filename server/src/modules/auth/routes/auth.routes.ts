import { Router } from "express";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { catchAsync } from "../../../utils/catch-async";
import { login, me, register } from "../controllers/auth.controller";

const router = Router();

router.post("/register", catchAsync(register));
router.post("/login", catchAsync(login));
router.get("/me", authMiddleware, catchAsync(me));

export { router as authRouter };
