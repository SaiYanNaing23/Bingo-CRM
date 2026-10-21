"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeDocuments = exports.requireDocumentEntity = exports.entityFields = exports.entityColumns = void 0;
const client_1 = require("../../../generated/prisma/client");
const app_error_1 = require("../../../shared/errors/app-error");
const documents_dto_1 = require("../dto/documents.dto");
exports.entityColumns = {
    COMPANY: "companyId",
    CONTACT: "contactId",
    APPLICATION: "applicationId",
    TASK: "taskId",
    PROJECT: "projectId",
};
const entityTables = {
    COMPANY: client_1.Prisma.sql `"Company"`,
    CONTACT: client_1.Prisma.sql `"Contact"`,
    APPLICATION: client_1.Prisma.sql `"Application"`,
    TASK: client_1.Prisma.sql `"Task"`,
    PROJECT: client_1.Prisma.sql `"Project"`,
};
const entityFields = (entity) => {
    const fields = {
        companyId: null,
        contactId: null,
        applicationId: null,
        taskId: null,
        projectId: null,
    };
    if (entity)
        fields[exports.entityColumns[entity.type]] = entity.id;
    return fields;
};
exports.entityFields = entityFields;
const requireDocumentEntity = async (tx, entity, userId) => {
    const rows = await tx.$queryRaw(client_1.Prisma.sql `
    SELECT "id" FROM ${entityTables[entity.type]}
    WHERE "id" = ${entity.id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    FOR SHARE
  `);
    if (!rows.length)
        throw new app_error_1.AppError("Linked entity not found", 404, undefined, "DOCUMENT_ENTITY_NOT_FOUND");
};
exports.requireDocumentEntity = requireDocumentEntity;
const storedEntity = (doc) => {
    for (const type of documents_dto_1.documentEntityTypes) {
        const id = doc[exports.entityColumns[type]];
        if (id)
            return { type, id };
    }
    return null;
};
const availableEntities = (tx, type, ids, userId) => {
    const query = { where: { id: { in: ids }, userId, deletedAt: null }, select: { id: true } };
    switch (type) {
        case "COMPANY":
            return tx.company.findMany(query);
        case "CONTACT":
            return tx.contact.findMany(query);
        case "APPLICATION":
            return tx.application.findMany(query);
        case "TASK":
            return tx.task.findMany(query);
        case "PROJECT":
            return tx.project.findMany(query);
    }
};
const serializeDocuments = async (tx, rows, userId) => {
    const entities = rows.map(storedEntity);
    const available = new Map();
    await Promise.all(documents_dto_1.documentEntityTypes.map(async (type) => {
        const ids = [...new Set(entities.filter(entity => entity?.type === type).map(entity => entity.id))];
        if (ids.length) {
            available.set(type, new Set((await availableEntities(tx, type, ids, userId)).map(row => row.id)));
        }
    }));
    return rows.map((doc, index) => {
        const entity = entities[index] ?? null;
        const isAvailable = entity ? (available.get(entity.type)?.has(entity.id) ?? false) : null;
        const versions = doc.versions ?? [];
        const currentVersion = versions[0] ?? null;
        const versionCount = doc._count?.versions ?? versions.length;
        return {
            id: doc.id,
            userId: doc.userId,
            title: doc.title,
            type: doc.type,
            description: doc.description,
            tags: doc.tags,
            entity,
            entityAvailable: isAvailable,
            currentVersion,
            versionCount,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            deletedAt: doc.deletedAt,
        };
    });
};
exports.serializeDocuments = serializeDocuments;
//# sourceMappingURL=documents.entities.js.map