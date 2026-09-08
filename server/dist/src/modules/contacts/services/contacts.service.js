"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContactFollowUp = exports.deleteContact = exports.updateContact = exports.getContact = exports.listContacts = exports.createContact = void 0;
const pagination_1 = require("../../../shared/utils/pagination");
const app_error_1 = require("../../../shared/errors/app-error");
const soft_delete_1 = require("../../../shared/utils/soft-delete");
const prisma_1 = require("../../../lib/prisma");
const db = prisma_1.prisma;
const contactSelect = {
    id: true,
    userId: true,
    companyId: true,
    photo: true,
    name: true,
    email: true,
    phone: true,
    linkedIn: true,
    role: true,
    notes: true,
    lastContactAt: true,
    nextFollowUpAt: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
};
const contactNotFoundError = () => {
    return new app_error_1.AppError("Contact not found", 404, undefined, "CONTACT_NOT_FOUND");
};
const companyNotFoundForUserError = () => {
    return new app_error_1.AppError("Company not found", 404, undefined, "CONTACT_COMPANY_NOT_FOUND");
};
const ensureCompanyOwnership = async (companyId, userId) => {
    const existing = await db.company.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ id: companyId, userId }),
        select: { id: true },
    });
    if (!existing) {
        throw companyNotFoundForUserError();
    }
};
const createContact = async (input, userId) => {
    await ensureCompanyOwnership(input.companyId, userId);
    const created = await db.contact.create({
        data: {
            ...input,
            userId,
        },
        select: contactSelect,
    });
    return created;
};
exports.createContact = createContact;
const listContacts = async (query, userId) => {
    const { page, limit } = (0, pagination_1.parsePaginationQuery)({
        page: query.page?.toString(),
        limit: query.limit?.toString(),
    });
    const searchQuery = query.search?.trim();
    const where = (0, soft_delete_1.withActiveRecordFilter)({ userId });
    if (query.companyId) {
        Object.assign(where, { companyId: query.companyId });
    }
    if (searchQuery) {
        Object.assign(where, {
            OR: [
                {
                    name: {
                        contains: searchQuery,
                        mode: "insensitive",
                    },
                },
                {
                    email: {
                        contains: searchQuery,
                        mode: "insensitive",
                    },
                },
                {
                    phone: {
                        contains: searchQuery,
                        mode: "insensitive",
                    },
                },
                {
                    role: {
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
        });
    }
    const orderBy = {
        [query.sortBy ?? "updatedAt"]: query.order ?? "desc",
    };
    const [total, data] = await Promise.all([
        db.contact.count({ where }),
        db.contact.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy,
            select: contactSelect,
        }),
    ]);
    return {
        data: data,
        meta: (0, pagination_1.toPaginationMeta)(total, page, limit),
    };
};
exports.listContacts = listContacts;
const getContact = async (id, userId) => {
    const where = (0, soft_delete_1.withActiveRecordFilter)({ id, userId });
    const contact = await db.contact.findFirst({
        where,
        select: contactSelect,
    });
    if (!contact) {
        throw contactNotFoundError();
    }
    return contact;
};
exports.getContact = getContact;
const updateContact = async (id, input, userId) => {
    const where = (0, soft_delete_1.withActiveRecordFilter)({ id, userId });
    const existing = await db.contact.findFirst({
        where,
        select: { id: true },
    });
    if (!existing) {
        throw contactNotFoundError();
    }
    if (input.companyId !== undefined) {
        await ensureCompanyOwnership(input.companyId, userId);
    }
    const updated = await db.contact.update({
        where: { id },
        data: input,
        select: contactSelect,
    });
    return updated;
};
exports.updateContact = updateContact;
const deleteContact = async (id, userId) => {
    const where = (0, soft_delete_1.withActiveRecordFilter)({ id, userId });
    const existing = await db.contact.findFirst({
        where,
        select: { id: true },
    });
    if (!existing) {
        throw contactNotFoundError();
    }
    await db.contact.update({
        where: { id },
        data: {
            deletedAt: new Date(),
        },
        select: { id: true },
    });
};
exports.deleteContact = deleteContact;
const updateContactFollowUp = async (id, input, userId) => {
    const where = (0, soft_delete_1.withActiveRecordFilter)({ id, userId });
    const existing = await db.contact.findFirst({
        where,
        select: { id: true },
    });
    if (!existing) {
        throw contactNotFoundError();
    }
    const updated = await db.contact.update({
        where: { id },
        data: input,
        select: contactSelect,
    });
    return updated;
};
exports.updateContactFollowUp = updateContactFollowUp;
//# sourceMappingURL=contacts.service.js.map