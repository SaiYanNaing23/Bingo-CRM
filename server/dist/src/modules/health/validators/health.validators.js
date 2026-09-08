"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHealthQuery = void 0;
const health_dto_1 = require("../dto/health.dto");
const validateHealthQuery = (data) => health_dto_1.healthQuerySchema.parse(data);
exports.validateHealthQuery = validateHealthQuery;
//# sourceMappingURL=health.validators.js.map