"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotes = exports.deleteNote = exports.updateNote = exports.getNote = exports.createNote = void 0;
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const app_error_1 = require("../../../shared/errors/app-error");
const omit_undefined_1 = require("../../../shared/utils/omit-undefined");
const pagination_1 = require("../../../shared/utils/pagination");
const soft_delete_1 = require("../../../shared/utils/soft-delete");
const notes_types_1 = require("../types/notes.types");
const notes_entities_1 = require("./notes.entities");
const notFound = () => new app_error_1.AppError("Note not found", 404, undefined, "NOTE_NOT_FOUND");
const transactionOptions = { maxWait: 10000, timeout: 15000 };
const readOptions = { ...transactionOptions, isolationLevel: client_1.Prisma.TransactionIsolationLevel.RepeatableRead };
const withLockedNote = (id, userId, work) => prisma_1.prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw `
      SELECT "id" FROM "Note"
      WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
      FOR UPDATE
    `;
    if (!rows.length)
        throw notFound();
    return work(tx);
}, transactionOptions);
const createNote = (input, userId) => prisma_1.prisma.$transaction(async (tx) => {
    const { entity, ...fields } = input;
    if (entity)
        await (0, notes_entities_1.requireNoteEntity)(tx, entity, userId);
    const note = await tx.note.create({ data: { ...fields, userId, ...(0, notes_entities_1.entityFields)(entity) }, select: notes_types_1.noteSelect });
    return (await (0, notes_entities_1.serializeNotes)(tx, [note], userId))[0];
}, transactionOptions);
exports.createNote = createNote;
const getNote = (id, userId) => prisma_1.prisma.$transaction(async (tx) => {
    const note = await tx.note.findFirst({ where: (0, soft_delete_1.withActiveRecordFilter)({ id, userId }), select: notes_types_1.noteSelect });
    if (!note)
        throw notFound();
    return (await (0, notes_entities_1.serializeNotes)(tx, [note], userId))[0];
}, readOptions);
exports.getNote = getNote;
const updateNote = (id, input, userId) => withLockedNote(id, userId, async (tx) => {
    const { entity, ...fields } = input;
    if (entity)
        await (0, notes_entities_1.requireNoteEntity)(tx, entity, userId);
    const note = await tx.note.update({
        where: { id },
        data: { ...(0, omit_undefined_1.omitUndefined)(fields), ...(entity === undefined ? {} : (0, notes_entities_1.entityFields)(entity)) },
        select: notes_types_1.noteSelect,
    });
    return (await (0, notes_entities_1.serializeNotes)(tx, [note], userId))[0];
});
exports.updateNote = updateNote;
const deleteNote = async (id, userId) => {
    await withLockedNote(id, userId, tx => tx.note.update({
        where: { id }, data: { deletedAt: new Date() }, select: { id: true },
    }));
};
exports.deleteNote = deleteNote;
const listNotes = async (query, userId) => {
    const { page, limit } = (0, pagination_1.parsePaginationQuery)({ page: query.page?.toString(), limit: query.limit?.toString() });
    const where = (0, soft_delete_1.withActiveRecordFilter)({ userId });
    if (query.tag)
        where.tags = { has: query.tag };
    if (query.entityType && query.entityId)
        where[notes_entities_1.entityColumns[query.entityType]] = query.entityId;
    if (query.search)
        where.OR = [
            { title: { contains: query.search, mode: "insensitive" } },
            { content: { contains: query.search, mode: "insensitive" } },
        ];
    const orderBy = [{ [query.sortBy]: query.order }, { id: "asc" }];
    return prisma_1.prisma.$transaction(async (tx) => {
        const total = await tx.note.count({ where });
        const rows = await tx.note.findMany({ where, select: notes_types_1.noteSelect, orderBy, skip: (page - 1) * limit, take: limit });
        return { data: await (0, notes_entities_1.serializeNotes)(tx, rows, userId), meta: (0, pagination_1.toPaginationMeta)(total, page, limit) };
    }, readOptions);
};
exports.listNotes = listNotes;
//# sourceMappingURL=notes.service.js.map