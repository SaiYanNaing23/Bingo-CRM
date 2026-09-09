import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../shared/errors/app-error";
import { omitUndefined } from "../../../shared/utils/omit-undefined";
import { parsePaginationQuery, toPaginationMeta } from "../../../shared/utils/pagination";
import { withActiveRecordFilter } from "../../../shared/utils/soft-delete";
import type { CreateNoteInput, UpdateNoteInput, NoteListQuery } from "../dto/notes.dto";
import { noteSelect } from "../types/notes.types";
import { entityColumns, entityFields, requireNoteEntity, serializeNotes } from "./notes.entities";

const notFound = () => new AppError("Note not found", 404, undefined, "NOTE_NOT_FOUND");
const transactionOptions = { maxWait: 10000, timeout: 15000 };
const readOptions = { ...transactionOptions, isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead };

const withLockedNote = <T>(id: string, userId: string, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> =>
  prisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Note"
      WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
      FOR UPDATE
    `;
    if (!rows.length) throw notFound();
    return work(tx);
  }, transactionOptions);

export const createNote = (input: CreateNoteInput, userId: string) => prisma.$transaction(async tx => {
  const { entity, ...fields } = input;
  if (entity) await requireNoteEntity(tx, entity, userId);
  const note = await tx.note.create({ data: { ...fields, userId, ...entityFields(entity) }, select: noteSelect });
  return (await serializeNotes(tx, [note], userId))[0]!;
}, transactionOptions);

export const getNote = (id: string, userId: string) => prisma.$transaction(async tx => {
  const note = await tx.note.findFirst({ where: withActiveRecordFilter({ id, userId }), select: noteSelect });
  if (!note) throw notFound();
  return (await serializeNotes(tx, [note], userId))[0]!;
}, readOptions);

export const updateNote = (id: string, input: UpdateNoteInput, userId: string) => withLockedNote(id, userId, async tx => {
  const { entity, ...fields } = input;
  if (entity) await requireNoteEntity(tx, entity, userId);
  const note = await tx.note.update({
    where: { id },
    data: { ...omitUndefined(fields), ...(entity === undefined ? {} : entityFields(entity)) },
    select: noteSelect,
  });
  return (await serializeNotes(tx, [note], userId))[0]!;
});

export const deleteNote = async (id: string, userId: string): Promise<void> => {
  await withLockedNote(id, userId, tx => tx.note.update({
    where: { id }, data: { deletedAt: new Date() }, select: { id: true },
  }));
};

export const listNotes = async (query: NoteListQuery, userId: string) => {
  const { page, limit } = parsePaginationQuery({ page: query.page?.toString(), limit: query.limit?.toString() });
  const where: Prisma.NoteWhereInput = withActiveRecordFilter({ userId });
  if (query.tag) where.tags = { has: query.tag };
  if (query.entityType && query.entityId) where[entityColumns[query.entityType]] = query.entityId;
  if (query.search) where.OR = [
    { title: { contains: query.search, mode: "insensitive" } },
    { content: { contains: query.search, mode: "insensitive" } },
  ];
  const orderBy: Prisma.NoteOrderByWithRelationInput[] = [{ [query.sortBy]: query.order }, { id: "asc" }];
  return prisma.$transaction(async tx => {
    const total = await tx.note.count({ where });
    const rows = await tx.note.findMany({ where, select: noteSelect, orderBy, skip: (page - 1) * limit, take: limit });
    return { data: await serializeNotes(tx, rows, userId), meta: toPaginationMeta(total, page, limit) };
  }, readOptions);
};
