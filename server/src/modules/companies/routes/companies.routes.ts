import { Router } from "express";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { catchAsync } from "../../../utils/catch-async";
import {
  createCompanyController,
  deleteCompanyController,
  getCompanyController,
  listCompaniesController,
  transitionCompanyStatusController,
  updateCompanyController,
} from "../controllers/companies.controller";

const router = Router();

router.post("/", authMiddleware, catchAsync(createCompanyController));
router.get("/", authMiddleware, catchAsync(listCompaniesController));
router.get("/:id", authMiddleware, catchAsync(getCompanyController));
router.put("/:id", authMiddleware, catchAsync(updateCompanyController));
router.delete("/:id", authMiddleware, catchAsync(deleteCompanyController));
router.patch("/:id/status", authMiddleware, catchAsync(transitionCompanyStatusController));

export { router as companiesRouter };
