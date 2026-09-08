"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listApplicationStageHistoryController = exports.transitionApplicationStageController = exports.deleteApplicationController = exports.updateApplicationController = exports.getApplicationController = exports.listApplicationsController = exports.createApplicationController = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const response_1 = require("../../../shared/utils/response");
const service = __importStar(require("../services/applications.service"));
const validate = __importStar(require("../validators/applications.validators"));
const userId = (req) => {
    if (!req.user)
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    return req.user.id;
};
const applicationId = (req) => validate.validateApplicationId(req.params.id);
const createApplicationController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.createApplication(validate.validateCreateApplication(req.body), userId(req)), 201);
};
exports.createApplicationController = createApplicationController;
const listApplicationsController = async (req, res) => {
    const result = await service.listApplications(validate.validateApplicationListQuery(req.query), userId(req));
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listApplicationsController = listApplicationsController;
const getApplicationController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.getApplication(applicationId(req), userId(req)));
};
exports.getApplicationController = getApplicationController;
const updateApplicationController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.updateApplication(applicationId(req), validate.validateUpdateApplication(req.body), userId(req)));
};
exports.updateApplicationController = updateApplicationController;
const deleteApplicationController = async (req, res) => {
    await service.deleteApplication(applicationId(req), userId(req));
    (0, response_1.sendSuccess)(res, { message: "Application deleted" });
};
exports.deleteApplicationController = deleteApplicationController;
const transitionApplicationStageController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.transitionApplicationStage(applicationId(req), validate.validateApplicationStageUpdate(req.body), userId(req)));
};
exports.transitionApplicationStageController = transitionApplicationStageController;
const listApplicationStageHistoryController = async (req, res) => {
    const result = await service.listApplicationStageHistory(applicationId(req), validate.validateApplicationHistoryQuery(req.query), userId(req));
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listApplicationStageHistoryController = listApplicationStageHistoryController;
//# sourceMappingURL=applications.controller.js.map