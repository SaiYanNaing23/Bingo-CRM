"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transitionCompanyStatusController = exports.deleteCompanyController = exports.updateCompanyController = exports.getCompanyController = exports.listCompaniesController = exports.createCompanyController = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const response_1 = require("../../../shared/utils/response");
const response_2 = require("../../../shared/utils/response");
const companies_service_1 = require("../services/companies.service");
const companies_validators_1 = require("../validators/companies.validators");
const createCompanyController = async (req, res) => {
    const payload = (0, companies_validators_1.validateCreateCompany)(req.body);
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const result = await (0, companies_service_1.createCompany)(payload, userId);
    (0, response_1.sendSuccess)(res, result, 201);
};
exports.createCompanyController = createCompanyController;
const listCompaniesController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const query = (0, companies_validators_1.validateCompanyListQuery)(req.query);
    const result = await (0, companies_service_1.listCompanies)(query, userId);
    (0, response_2.sendPaginated)(res, result.data, result.meta);
};
exports.listCompaniesController = listCompaniesController;
const getCompanyController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const result = await (0, companies_service_1.getCompany)(id, userId);
    (0, response_1.sendSuccess)(res, result);
};
exports.getCompanyController = getCompanyController;
const updateCompanyController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const payload = (0, companies_validators_1.validateUpdateCompany)(req.body);
    const result = await (0, companies_service_1.updateCompany)(id, payload, userId);
    (0, response_1.sendSuccess)(res, result);
};
exports.updateCompanyController = updateCompanyController;
const deleteCompanyController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    await (0, companies_service_1.deleteCompany)(id, userId);
    (0, response_1.sendSuccess)(res, { message: "Company deleted" });
};
exports.deleteCompanyController = deleteCompanyController;
const transitionCompanyStatusController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const payload = (0, companies_validators_1.validateCompanyStatusTransition)(req.body);
    const result = await (0, companies_service_1.transitionCompanyStatus)(id, payload, userId);
    (0, response_1.sendSuccess)(res, result);
};
exports.transitionCompanyStatusController = transitionCompanyStatusController;
//# sourceMappingURL=companies.controller.js.map