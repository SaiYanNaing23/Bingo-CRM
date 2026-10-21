"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocumentVersion = exports.listDocumentVersions = exports.addDocumentVersion = exports.listDocuments = exports.deleteDocument = exports.updateDocument = exports.getDocument = exports.createDocument = void 0;
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const app_error_1 = require("../../../shared/errors/app-error");
const omit_undefined_1 = require("../../../shared/utils/omit-undefined");
const pagination_1 = require("../../../shared/utils/pagination");
const soft_delete_1 = require("../../../shared/utils/soft-delete");
const documents_types_1 = require("../types/documents.types");
const documents_entities_1 = require("./documents.entities");
const notFound = () => new app_error_1.AppError("Document not found", 404, undefined, "DOCUMENT_NOT_FOUND");
const versionNotFound = () => new app_error_1.AppError("Document version not found", 404, undefined, "DOCUMENT_VERSION_NOT_FOUND");
const transactionOptions = { maxWait: 10000, timeout: 15000 };
const readOptions = { ...transactionOptions, isolationLevel: client_1.Prisma.TransactionIsolationLevel.RepeatableRead };
const withLockedDocument = (id, userId, work) => prisma_1.prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw `
      SELECT "id" FROM "Document"
      WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
      FOR UPDATE
    `;
    if (!rows.length)
        throw notFound();
    return work(tx);
}, transactionOptions);
const createDocument = (input, userId) => prisma_1.prisma.$transaction(async (tx) => {
    const { title, type, description, tags, entity, fileName, fileSize, mimeType, fileUrl, storageProvider, storageKey, changelog, } = input;
    if (entity)
        await (0, documents_entities_1.requireDocumentEntity)(tx, entity, userId);
    const doc = await tx.document.create({
        data: {
            title,
            type,
            description: description ?? null,
            tags,
            userId,
            ...(0, documents_entities_1.entityFields)(entity),
        },
        select: documents_types_1.documentSelect,
    });
    const initialVersion = await tx.documentVersion.create({
        data: {
            documentId: doc.id,
            userId,
            version: 1,
            fileName,
            fileSize,
            mimeType,
            fileUrl,
            storageProvider: storageProvider ?? "METADATA",
            storageKey: storageKey ?? null,
            changelog: changelog ?? "Initial version",
        },
        select: documents_types_1.documentVersionSelect,
    });
    const storedDoc = {
        ...doc,
        versions: [initialVersion],
        _count: { versions: 1 },
    };
    return (await (0, documents_entities_1.serializeDocuments)(tx, [storedDoc], userId))[0];
}, transactionOptions);
exports.createDocument = createDocument;
const getDocument = (id, userId) => prisma_1.prisma.$transaction(async (tx) => {
    const doc = await tx.document.findFirst({
        where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }),
        select: {
            ...documents_types_1.documentSelect,
            versions: {
                where: { deletedAt: null },
                orderBy: { version: "desc" },
                take: 1,
                select: documents_types_1.documentVersionSelect,
            },
            _count: {
                select: { versions: { where: { deletedAt: null } } },
            },
        },
    });
    if (!doc)
        throw notFound();
    return (await (0, documents_entities_1.serializeDocuments)(tx, [doc], userId))[0];
}, readOptions);
exports.getDocument = getDocument;
const updateDocument = (id, input, userId) => withLockedDocument(id, userId, async (tx) => {
    const { entity, ...fields } = input;
    if (entity)
        await (0, documents_entities_1.requireDocumentEntity)(tx, entity, userId);
    const doc = await tx.document.update({
        where: { id },
        data: {
            ...(0, omit_undefined_1.omitUndefined)(fields),
            ...(entity === undefined ? {} : (0, documents_entities_1.entityFields)(entity)),
        },
        select: {
            ...documents_types_1.documentSelect,
            versions: {
                where: { deletedAt: null },
                orderBy: { version: "desc" },
                take: 1,
                select: documents_types_1.documentVersionSelect,
            },
            _count: {
                select: { versions: { where: { deletedAt: null } } },
            },
        },
    });
    return (await (0, documents_entities_1.serializeDocuments)(tx, [doc], userId))[0];
});
exports.updateDocument = updateDocument;
const deleteDocument = async (id, userId) => {
    await withLockedDocument(id, userId, async (tx) => {
        const now = new Date();
        await tx.document.update({
            where: { id },
            data: { deletedAt: now },
            select: { id: true },
        });
        await tx.documentVersion.updateMany({
            where: { documentId: id, deletedAt: null },
            data: { deletedAt: now },
        });
    });
};
exports.deleteDocument = deleteDocument;
const listDocuments = async (query, userId) => {
    const { page, limit } = (0, pagination_1.parsePaginationQuery)({ page: query.page?.toString(), limit: query.limit?.toString() });
    const where = (0, soft_delete_1.withActiveRecordFilter)({ userId });
    if (query.type)
        where.type = query.type;
    if (query.tag)
        where.tags = { has: query.tag };
    if (query.search) {
        where.OR = [
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
        ];
    }
    if (query.entityType && query.entityId) {
        where[documents_entities_1.entityColumns[query.entityType]] = query.entityId;
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const [total, rows] = await Promise.all([
            tx.document.count({ where }),
            tx.document.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [{ [query.sortBy]: query.order }, { id: "asc" }],
                select: {
                    ...documents_types_1.documentSelect,
                    versions: {
                        where: { deletedAt: null },
                        orderBy: { version: "desc" },
                        take: 1,
                        select: documents_types_1.documentVersionSelect,
                    },
                    _count: {
                        select: { versions: { where: { deletedAt: null } } },
                    },
                },
            }),
        ]);
        const data = await (0, documents_entities_1.serializeDocuments)(tx, rows, userId);
        return { data, meta: (0, pagination_1.toPaginationMeta)(total, page, limit) };
    }, readOptions);
};
exports.listDocuments = listDocuments;
const addDocumentVersion = (documentId, input, userId) => withLockedDocument(documentId, userId, async (tx) => {
    const rows = await tx.$queryRaw `
      SELECT MAX("version") as max_version FROM "DocumentVersion"
      WHERE "documentId" = ${documentId}
    `;
    const nextVersion = (rows[0]?.max_version ?? 0) + 1;
    const version = await tx.documentVersion.create({
        data: {
            documentId,
            userId,
            version: nextVersion,
            fileName: input.fileName,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
            fileUrl: input.fileUrl,
            storageProvider: input.storageProvider ?? "METADATA",
            storageKey: input.storageKey ?? null,
            changelog: input.changelog ?? null,
        },
        select: documents_types_1.documentVersionSelect,
    });
    await tx.document.update({
        where: { id: documentId },
        data: { updatedAt: new Date() },
        select: { id: true },
    });
    return version;
});
exports.addDocumentVersion = addDocumentVersion;
const listDocumentVersions = async (documentId, query, userId) => {
    const { page, limit } = (0, pagination_1.parsePaginationQuery)({ page: query.page?.toString(), limit: query.limit?.toString() });
    return prisma_1.prisma.$transaction(async (tx) => {
        const doc = await tx.document.findFirst({
            where: (0, soft_delete_1.withActiveRecordFilter)({ id: documentId, userId }),
            select: { id: true },
        });
        if (!doc)
            throw notFound();
        const where = {
            documentId,
            deletedAt: null,
        };
        const [total, rows] = await Promise.all([
            tx.documentVersion.count({ where }),
            tx.documentVersion.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [{ version: query.order }, { id: "asc" }],
                select: documents_types_1.documentVersionSelect,
            }),
        ]);
        return { data: rows, meta: (0, pagination_1.toPaginationMeta)(total, page, limit) };
    }, readOptions);
};
exports.listDocumentVersions = listDocumentVersions;
const deleteDocumentVersion = async (documentId, versionId, userId) => {
    await withLockedDocument(documentId, userId, async (tx) => {
        const targetVersion = await tx.documentVersion.findFirst({
            where: { id: versionId, documentId, deletedAt: null },
            select: { id: true },
        });
        if (!targetVersion)
            throw versionNotFound();
        const remainingActive = await tx.documentVersion.count({
            where: { documentId, deletedAt: null },
        });
        if (remainingActive <= 1) {
            throw new app_error_1.AppError("Cannot delete the only active version of a document. Delete the document instead.", 400, undefined, "CANNOT_DELETE_ONLY_VERSION");
        }
        await tx.documentVersion.update({
            where: { id: versionId },
            data: { deletedAt: new Date() },
            select: { id: true },
        });
        await tx.document.update({
            where: { id: documentId },
            data: { updatedAt: new Date() },
            select: { id: true },
        });
    });
};
exports.deleteDocumentVersion = deleteDocumentVersion;
//# sourceMappingURL=documents.service.js.map