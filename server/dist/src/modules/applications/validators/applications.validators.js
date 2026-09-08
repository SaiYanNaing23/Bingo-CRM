"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApplicationStageUpdate = exports.validateApplicationHistoryQuery = exports.validateApplicationListQuery = exports.validateApplicationId = exports.validateUpdateApplication = exports.validateCreateApplication = void 0;
const applications_dto_1 = require("../dto/applications.dto");
const validateCreateApplication = (input) => applications_dto_1.createApplicationSchema.parse(input);
exports.validateCreateApplication = validateCreateApplication;
const validateUpdateApplication = (input) => applications_dto_1.updateApplicationSchema.parse(input);
exports.validateUpdateApplication = validateUpdateApplication;
const validateApplicationId = (input) => applications_dto_1.applicationIdSchema.parse(input);
exports.validateApplicationId = validateApplicationId;
const validateApplicationListQuery = (input) => applications_dto_1.applicationListQuerySchema.parse(input);
exports.validateApplicationListQuery = validateApplicationListQuery;
const validateApplicationHistoryQuery = (input) => applications_dto_1.applicationHistoryQuerySchema.parse(input);
exports.validateApplicationHistoryQuery = validateApplicationHistoryQuery;
const validateApplicationStageUpdate = (input) => applications_dto_1.applicationStageUpdateSchema.parse(input);
exports.validateApplicationStageUpdate = validateApplicationStageUpdate;
//# sourceMappingURL=applications.validators.js.map