"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeNotes = exports.requireNoteEntity = exports.entityFields = exports.entityColumns = void 0;
const client_1 = require("../../../generated/prisma/client");
const app_error_1 = require("../../../shared/errors/app-error");
const notes_dto_1 = require("../dto/notes.dto");
exports.entityColumns = {
    COMPANY: "companyId", CONTACT: "contactId", APPLICATION: "applicationId", TASK: "taskId", PROJECT: "projectId",
};
// SQL identifiers come only from this fixed allowlist, never from a request string.
const entityTables = {
    COMPANY: client_1.Prisma.sql `"Company"`, CONTACT: client_1.Prisma.sql `"Contact"`, APPLICATION: client_1.Prisma.sql `"Application"`,
    TASK: client_1.Prisma.sql `"Task"`, PROJECT: client_1.Prisma.sql `"Project"`,
};
const entityFields = (entity) => {
    const fields = {
        companyId: null, contactId: null, applicationId: null, taskId: null, projectId: null,
    };
    if (entity)
        fields[exports.entityColumns[entity.type]] = entity.id;
    return fields;
};
exports.entityFields = entityFields;
const requireNoteEntity = async (tx, entity, userId) => {
    // SHARE permits concurrent note creation but blocks soft-delete/non-key updates until commit.
    // The active/owner predicates are rechecked by PostgreSQL after waiting on another writer.
    const rows = await tx.$queryRaw(client_1.Prisma.sql `
    SELECT "id" FROM ${entityTables[entity.type]}
    WHERE "id" = ${entity.id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    FOR SHARE
  `);
    if (!rows.length)
        throw new app_error_1.AppError("Linked entity not found", 404, undefined, "NOTE_ENTITY_NOT_FOUND");
};
exports.requireNoteEntity = requireNoteEntity;
const storedEntity = (note) => {
    for (const type of notes_dto_1.noteEntityTypes) {
        const id = note[exports.entityColumns[type]];
        if (id)
            return { type, id };
    }
    return null;
};
const availableEntities = (tx, type, ids, userId) => {
    const query = { where: { id: { in: ids }, userId, deletedAt: null }, select: { id: true } };
    switch (type) {
        case "COMPANY": return tx.company.findMany(query);
        case "CONTACT": return tx.contact.findMany(query);
        case "APPLICATION": return tx.application.findMany(query);
        case "TASK": return tx.task.findMany(query);
        case "PROJECT": return tx.project.findMany(query);
    }
};
const serializeNotes = async (tx, rows, userId) => {
    const entities = rows.map(storedEntity);
    const available = new Map();
    // At most one lookup per represented type, regardless of the number of notes on the page.
    await Promise.all(notes_dto_1.noteEntityTypes.map(async (type) => {
        const ids = [...new Set(entities.filter(entity => entity?.type === type).map(entity => entity.id))];
        if (ids.length)
            available.set(type, new Set((await availableEntities(tx, type, ids, userId)).map(row => row.id)));
    }));
    return rows.map((row, index) => {
        const entity = entities[index] ?? null;
        return {
            id: row.id, userId: row.userId, title: row.title, content: row.content, tags: row.tags,
            entity, entityAvailable: entity ? available.get(entity.type)?.has(entity.id) ?? false : null,
            createdAt: row.createdAt, updatedAt: row.updatedAt, deletedAt: row.deletedAt,
        };
    });
};
exports.serializeNotes = serializeNotes;
//# sourceMappingURL=notes.entities.js.map