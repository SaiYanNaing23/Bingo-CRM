"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transitionCompanyStatus = exports.deleteCompany = exports.updateCompany = exports.getCompany = exports.listCompanies = exports.createCompany = void 0;
const pagination_1 = require("../../../shared/utils/pagination");
const app_error_1 = require("../../../shared/errors/app-error");
const soft_delete_1 = require("../../../shared/utils/soft-delete");
const omit_undefined_1 = require("../../../shared/utils/omit-undefined");
const prisma_1 = require("../../../lib/prisma");
const companySelect = {
    id: true,
    userId: true,
    logo: true,
    name: true,
    country: true,
    industry: true,
    website: true,
    linkedIn: true,
    careerPage: true,
    techStack: true,
    size: true,
    salaryRange: true,
    remote: true,
    notes: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
};
const companyNotFoundError = () => {
    return new app_error_1.AppError("Company not found", 404, undefined, "COMPANY_NOT_FOUND");
};
const createCompany = async (input, userId) => {
    return prisma_1.prisma.company.create({
        data: {
            ...(0, omit_undefined_1.omitUndefined)(input),
            userId,
        },
        select: companySelect,
    });
};
exports.createCompany = createCompany;
const listCompanies = async (query, userId) => {
    const { page, limit } = (0, pagination_1.parsePaginationQuery)({
        page: query.page?.toString(),
        limit: query.limit?.toString(),
    });
    const searchQuery = query.search?.trim();
    const where = (0, soft_delete_1.withActiveRecordFilter)((0, omit_undefined_1.omitUndefined)({
        userId,
        status: query.status,
        country: query.country,
        industry: query.industry,
        remote: query.remote,
        ...(searchQuery
            ? {
                OR: [
                    {
                        name: {
                            contains: searchQuery,
                            mode: "insensitive",
                        },
                    },
                    {
                        notes: {
                            contains: searchQuery,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {}),
    }));
    const orderBy = {
        [query.sortBy ?? "createdAt"]: query.order ?? "desc",
    };
    const [total, data] = await Promise.all([
        prisma_1.prisma.company.count({ where }),
        prisma_1.prisma.company.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy,
            select: companySelect,
        }),
    ]);
    return { data, meta: (0, pagination_1.toPaginationMeta)(total, page, limit) };
};
exports.listCompanies = listCompanies;
const getCompany = async (id, userId) => {
    const company = await prisma_1.prisma.company.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }),
        select: companySelect,
    });
    if (!company) {
        throw companyNotFoundError();
    }
    return company;
};
exports.getCompany = getCompany;
const updateCompany = async (id, input, userId) => {
    const existing = await prisma_1.prisma.company.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }),
        select: { id: true },
    });
    if (!existing) {
        throw companyNotFoundError();
    }
    return prisma_1.prisma.company.update({
        where: { id },
        data: (0, omit_undefined_1.omitUndefined)(input),
        select: companySelect,
    });
};
exports.updateCompany = updateCompany;
const deleteCompany = async (id, userId) => {
    const existing = await prisma_1.prisma.company.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }),
        select: { id: true },
    });
    if (!existing) {
        throw companyNotFoundError();
    }
    await prisma_1.prisma.company.update({
        where: { id },
        data: {
            deletedAt: new Date(),
        },
        select: { id: true },
    });
};
exports.deleteCompany = deleteCompany;
const transitionCompanyStatus = async (id, payload, userId) => {
    const existing = await prisma_1.prisma.company.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }),
        select: { id: true },
    });
    if (!existing) {
        throw companyNotFoundError();
    }
    return prisma_1.prisma.company.update({
        where: { id },
        data: {
            status: payload.status,
        },
        select: companySelect,
    });
};
exports.transitionCompanyStatus = transitionCompanyStatus;
//# sourceMappingURL=companies.service.js.map