"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeCalendarEvents = exports.requireCalendarSource = exports.sourceFields = exports.sourceColumns = void 0;
const client_1 = require("../../../generated/prisma/client");
const app_error_1 = require("../../../shared/errors/app-error");
const calendar_dto_1 = require("../dto/calendar.dto");
exports.sourceColumns = {
    COMPANY: "companyId", CONTACT: "contactId", APPLICATION: "applicationId", TASK: "taskId", PROJECT: "projectId",
};
const sourceTables = {
    COMPANY: client_1.Prisma.sql `"Company"`, CONTACT: client_1.Prisma.sql `"Contact"`, APPLICATION: client_1.Prisma.sql `"Application"`,
    TASK: client_1.Prisma.sql `"Task"`, PROJECT: client_1.Prisma.sql `"Project"`,
};
const sourceFields = (type, id) => {
    const fields = {
        companyId: null, contactId: null, applicationId: null, taskId: null, projectId: null,
    };
    if (type && id)
        fields[exports.sourceColumns[type]] = id;
    return fields;
};
exports.sourceFields = sourceFields;
const requireCalendarSource = async (tx, type, id, userId) => {
    // Static identifiers and bound values; SHARE waits for concurrent soft deletion.
    const rows = await tx.$queryRaw(client_1.Prisma.sql `
    SELECT "id" FROM ${sourceTables[type]}
    WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL FOR SHARE
  `);
    if (!rows.length)
        throw new app_error_1.AppError("Calendar source not found", 404, undefined, "CALENDAR_SOURCE_NOT_FOUND");
};
exports.requireCalendarSource = requireCalendarSource;
const availableSources = (tx, type, ids, userId) => {
    const query = { where: { id: { in: ids }, userId, deletedAt: null }, select: { id: true } };
    switch (type) {
        case "COMPANY": return tx.company.findMany(query);
        case "CONTACT": return tx.contact.findMany(query);
        case "APPLICATION": return tx.application.findMany(query);
        case "TASK": return tx.task.findMany(query);
        case "PROJECT": return tx.project.findMany(query);
    }
};
const serializeCalendarEvents = async (tx, rows, userId) => {
    const sources = rows.map(row => {
        const type = calendar_dto_1.calendarSourceTypes.find(type => row[exports.sourceColumns[type]] !== null);
        return type ? { type, id: row[exports.sourceColumns[type]] } : null;
    });
    const available = new Map();
    await Promise.all(calendar_dto_1.calendarSourceTypes.map(async (type) => {
        const ids = [...new Set(sources.filter(source => source?.type === type).map(source => source.id))];
        if (ids.length)
            available.set(type, new Set((await availableSources(tx, type, ids, userId)).map(row => row.id)));
    }));
    return rows.map((row, index) => {
        const source = sources[index];
        return {
            id: row.id, userId: row.userId, title: row.title, type: row.type,
            startAt: row.startAt, endAt: row.endAt, timezone: row.timezone, reminders: row.reminders,
            sourceEntityType: source?.type ?? null, sourceEntityId: source?.id ?? null,
            sourceAvailable: source ? available.get(source.type)?.has(source.id) ?? false : null,
            createdAt: row.createdAt, updatedAt: row.updatedAt, deletedAt: row.deletedAt,
        };
    });
};
exports.serializeCalendarEvents = serializeCalendarEvents;
//# sourceMappingURL=calendar.sources.js.map