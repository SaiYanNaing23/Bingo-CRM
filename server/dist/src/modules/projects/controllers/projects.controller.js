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
exports.listProjectActivitiesController = exports.createProjectCommentController = exports.updateProjectProgressController = exports.deleteProjectController = exports.updateProjectController = exports.getProjectController = exports.listProjectsController = exports.createProjectController = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const response_1 = require("../../../shared/utils/response");
const service = __importStar(require("../services/projects.service"));
const validate = __importStar(require("../validators/projects.validators"));
const userId = (req) => {
    if (!req.user)
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    return req.user.id;
};
const projectId = (req) => validate.validateProjectId(req.params.id);
const createProjectController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.createProject(validate.validateCreateProject(req.body), userId(req)), 201);
};
exports.createProjectController = createProjectController;
const listProjectsController = async (req, res) => {
    const result = await service.listProjects(validate.validateProjectListQuery(req.query), userId(req));
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listProjectsController = listProjectsController;
const getProjectController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.getProject(projectId(req), userId(req)));
};
exports.getProjectController = getProjectController;
const updateProjectController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.updateProject(projectId(req), validate.validateUpdateProject(req.body), userId(req)));
};
exports.updateProjectController = updateProjectController;
const deleteProjectController = async (req, res) => {
    const id = projectId(req);
    await service.deleteProject(id, userId(req));
    (0, response_1.sendSuccess)(res, { id, deleted: true });
};
exports.deleteProjectController = deleteProjectController;
const updateProjectProgressController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.updateProjectProgress(projectId(req), validate.validateProjectProgress(req.body), userId(req)));
};
exports.updateProjectProgressController = updateProjectProgressController;
const createProjectCommentController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.createProjectComment(projectId(req), validate.validateProjectComment(req.body), userId(req)), 201);
};
exports.createProjectCommentController = createProjectCommentController;
const listProjectActivitiesController = async (req, res) => {
    const result = await service.listProjectActivities(projectId(req), validate.validateProjectActivityQuery(req.query), userId(req));
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listProjectActivitiesController = listProjectActivitiesController;
//# sourceMappingURL=projects.controller.js.map