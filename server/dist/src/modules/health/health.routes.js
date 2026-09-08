"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const catch_async_1 = require("../../utils/catch-async");
const health_controller_1 = require("./health.controller");
const router = (0, express_1.Router)();
exports.healthRouter = router;
router.get("/health", (0, catch_async_1.catchAsync)(health_controller_1.healthController));
//# sourceMappingURL=health.routes.js.map