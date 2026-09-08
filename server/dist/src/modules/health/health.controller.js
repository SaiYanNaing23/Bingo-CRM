"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = void 0;
const health_service_1 = require("./health.service");
const health_validators_1 = require("./validators/health.validators");
const response_1 = require("../../shared/utils/response");
const healthController = async (req, res, _next) => {
    (0, health_validators_1.validateHealthQuery)(req.query);
    const payload = await (0, health_service_1.getHealth)();
    (0, response_1.sendSuccess)(res, payload);
};
exports.healthController = healthController;
//# sourceMappingURL=health.controller.js.map