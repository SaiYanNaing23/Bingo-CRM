import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../../shared/errors/app-error";
import { noteEntityTypes, type NoteEntity, type NoteEntityType } from "../dto/notes.dto";
import type { Note, StoredNote } from "../types/notes.types";

export const entityColumns = {
  COMPANY: "companyId", CONTACT: "contactId", APPLICATION: "applicationId", TASK: "taskId", PROJECT: "projectId",
} as const;
// SQL identifiers come only from this fixed allowlist, never from a request string.
const entityTables = {
  COMPANY: Prisma.sql`"Company"`, CONTACT: Prisma.sql`"Contact"`, APPLICATION: Prisma.sql`"Application"`,
  TASK: Prisma.sql`"Task"`, PROJECT: Prisma.sql`"Project"`,
};
type EntityColumn = typeof entityColumns[NoteEntityType];

export const entityFields = (entity: NoteEntity | null): Record<EntityColumn, string | null> => {
  const fields: Record<EntityColumn, string | null> = {
    companyId: null, contactId: null, applicationId: null, taskId: null, projectId: null,
  };
  if (entity) fields[entityColumns[entity.type]] = entity.id;
  return fields;
};

export const requireNoteEntity = async (tx: Prisma.TransactionClient, entity: NoteEntity, userId: string) => {
  // SHARE permits concurrent note creation but blocks soft-delete/non-key updates until commit.
  // The active/owner predicates are rechecked by PostgreSQL after waiting on another writer.
  const rows = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id" FROM ${entityTables[entity.type]}
    WHERE "id" = ${entity.id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    FOR SHARE
  `);
  if (!rows.length) throw new AppError("Linked entity not found", 404, undefined, "NOTE_ENTITY_NOT_FOUND");
};

const storedEntity = (note: StoredNote): NoteEntity | null => {
  for (const type of noteEntityTypes) {
    const id = note[entityColumns[type]];
    if (id) return { type, id };
  }
  return null;
};

const availableEntities = (tx: Prisma.TransactionClient, type: NoteEntityType, ids: string[], userId: string) => {
  const query = { where: { id: { in: ids }, userId, deletedAt: null }, select: { id: true } } as const;
  switch (type) {
    case "COMPANY": return tx.company.findMany(query);
    case "CONTACT": return tx.contact.findMany(query);
    case "APPLICATION": return tx.application.findMany(query);
    case "TASK": return tx.task.findMany(query);
    case "PROJECT": return tx.project.findMany(query);
  }
};

export const serializeNotes = async (tx: Prisma.TransactionClient, rows: StoredNote[], userId: string): Promise<Note[]> => {
  const entities = rows.map(storedEntity);
  const available = new Map<NoteEntityType, Set<string>>();
  // At most one lookup per represented type, regardless of the number of notes on the page.
  await Promise.all(noteEntityTypes.map(async type => {
    const ids = [...new Set(entities.filter(entity => entity?.type === type).map(entity => entity!.id))];
    if (ids.length) available.set(type, new Set((await availableEntities(tx, type, ids, userId)).map(row => row.id)));
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
