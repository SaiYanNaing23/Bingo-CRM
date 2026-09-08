"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companiesRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const catch_async_1 = require("../../../utils/catch-async");
const companies_controller_1 = require("../controllers/companies.controller");
const router = (0, express_1.Router)();
exports.companiesRouter = router;
router.post("/", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(companies_controller_1.createCompanyController));
router.get("/", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(companies_controller_1.listCompaniesController));
router.get("/:id", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(companies_controller_1.getCompanyController));
router.put("/:id", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(companies_controller_1.updateCompanyController));
router.delete("/:id", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(companies_controller_1.deleteCompanyController));
router.patch("/:id/status", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(companies_controller_1.transitionCompanyStatusController));
//# sourceMappingURL=companies.routes.js.map