"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProjectActivityQuery = exports.validateProjectListQuery = exports.validateProjectId = exports.validateProjectComment = exports.validateProjectProgress = exports.validateUpdateProject = exports.validateCreateProject = void 0;
const projects_dto_1 = require("../dto/projects.dto");
const validateCreateProject = (input) => projects_dto_1.createProjectSchema.parse(input);
exports.validateCreateProject = validateCreateProject;
const validateUpdateProject = (input) => projects_dto_1.updateProjectSchema.parse(input);
exports.validateUpdateProject = validateUpdateProject;
const validateProjectProgress = (input) => projects_dto_1.projectProgressSchema.parse(input);
exports.validateProjectProgress = validateProjectProgress;
const validateProjectComment = (input) => projects_dto_1.projectCommentSchema.parse(input);
exports.validateProjectComment = validateProjectComment;
const validateProjectId = (input) => projects_dto_1.projectIdSchema.parse(input);
exports.validateProjectId = validateProjectId;
const validateProjectListQuery = (input) => projects_dto_1.projectListQuerySchema.parse(input);
exports.validateProjectListQuery = validateProjectListQuery;
const validateProjectActivityQuery = (input) => projects_dto_1.projectActivityQuerySchema.parse(input);
exports.validateProjectActivityQuery = validateProjectActivityQuery;
//# sourceMappingURL=projects.validators.js.map