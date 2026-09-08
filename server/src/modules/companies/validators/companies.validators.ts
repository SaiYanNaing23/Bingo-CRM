import type { CompanyListQueryInput, CreateCompanyInput, UpdateCompanyInput, CompanyStatusTransitionInput } from "../dto/companies.dto";
import { createCompanySchema, updateCompanySchema, companyListQuerySchema, companyStatusTransitionSchema } from "../dto/companies.dto";

export const validateCreateCompany = (data: unknown): CreateCompanyInput =>
  createCompanySchema.parse(data);

export const validateUpdateCompany = (data: unknown): UpdateCompanyInput =>
  updateCompanySchema.parse(data);

export const validateCompanyListQuery = (data: unknown): CompanyListQueryInput =>
  companyListQuerySchema.parse(data);

export const validateCompanyStatusTransition = (
  data: unknown
): CompanyStatusTransitionInput => companyStatusTransitionSchema.parse(data);
