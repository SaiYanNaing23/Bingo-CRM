"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCompanyStatusTransition = exports.validateCompanyListQuery = exports.validateUpdateCompany = exports.validateCreateCompany = void 0;
const companies_dto_1 = require("../dto/companies.dto");
const validateCreateCompany = (data) => companies_dto_1.createCompanySchema.parse(data);
exports.validateCreateCompany = validateCreateCompany;
const validateUpdateCompany = (data) => companies_dto_1.updateCompanySchema.parse(data);
exports.validateUpdateCompany = validateUpdateCompany;
const validateCompanyListQuery = (data) => companies_dto_1.companyListQuerySchema.parse(data);
exports.validateCompanyListQuery = validateCompanyListQuery;
const validateCompanyStatusTransition = (data) => companies_dto_1.companyStatusTransitionSchema.parse(data);
exports.validateCompanyStatusTransition = validateCompanyStatusTransition;
//# sourceMappingURL=companies.validators.js.map