import type { CreateCompanyInput, UpdateCompanyInput, CompanyListQueryInput, CompanyStatusTransitionInput } from "../dto/companies.dto";
import type { Prisma } from "../../../generated/prisma/client";
import type { PaginationMeta } from "../../../shared/types/api-response";
type CompanyRecord = Prisma.CompanyGetPayload<{
    select: typeof companySelect;
}>;
declare const companySelect: {
    id: true;
    userId: true;
    logo: true;
    name: true;
    country: true;
    industry: true;
    website: true;
    linkedIn: true;
    careerPage: true;
    techStack: true;
    size: true;
    salaryRange: true;
    remote: true;
    notes: true;
    status: true;
    createdAt: true;
    updatedAt: true;
    deletedAt: true;
};
export declare const createCompany: (input: CreateCompanyInput, userId: string) => Promise<CompanyRecord>;
export declare const listCompanies: (query: CompanyListQueryInput, userId: string) => Promise<{
    data: CompanyRecord[];
    meta: PaginationMeta;
}>;
export declare const getCompany: (id: string, userId: string) => Promise<CompanyRecord>;
export declare const updateCompany: (id: string, input: UpdateCompanyInput, userId: string) => Promise<CompanyRecord>;
export declare const deleteCompany: (id: string, userId: string) => Promise<void>;
export declare const transitionCompanyStatus: (id: string, payload: CompanyStatusTransitionInput, userId: string) => Promise<CompanyRecord>;
export {};
//# sourceMappingURL=companies.service.d.ts.map