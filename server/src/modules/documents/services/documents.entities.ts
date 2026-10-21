import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../../shared/errors/app-error";
import { documentEntityTypes, type DocumentEntity, type DocumentEntityType } from "../dto/documents.dto";
import type { DocumentItem, DocumentVersionItem, StoredDocument } from "../types/documents.types";

export const entityColumns = {
  COMPANY: "companyId",
  CONTACT: "contactId",
  APPLICATION: "applicationId",
  TASK: "taskId",
  PROJECT: "projectId",
} as const;

const entityTables = {
  COMPANY: Prisma.sql`"Company"`,
  CONTACT: Prisma.sql`"Contact"`,
  APPLICATION: Prisma.sql`"Application"`,
  TASK: Prisma.sql`"Task"`,
  PROJECT: Prisma.sql`"Project"`,
};

type EntityColumn = (typeof entityColumns)[DocumentEntityType];

export const entityFields = (entity: DocumentEntity | null): Record<EntityColumn, string | null> => {
  const fields: Record<EntityColumn, string | null> = {
    companyId: null,
    contactId: null,
    applicationId: null,
    taskId: null,
    projectId: null,
  };
  if (entity) fields[entityColumns[entity.type]] = entity.id;
  return fields;
};

export const requireDocumentEntity = async (tx: Prisma.TransactionClient, entity: DocumentEntity, userId: string) => {
  const rows = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id" FROM ${entityTables[entity.type]}
    WHERE "id" = ${entity.id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    FOR SHARE
  `);
  if (!rows.length) throw new AppError("Linked entity not found", 404, undefined, "DOCUMENT_ENTITY_NOT_FOUND");
};

const storedEntity = (doc: StoredDocument): DocumentEntity | null => {
  for (const type of documentEntityTypes) {
    const id = doc[entityColumns[type]];
    if (id) return { type, id };
  }
  return null;
};

const availableEntities = (tx: Prisma.TransactionClient, type: DocumentEntityType, ids: string[], userId: string) => {
  const query = { where: { id: { in: ids }, userId, deletedAt: null }, select: { id: true } } as const;
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

export const serializeDocuments = async (
  tx: Prisma.TransactionClient,
  rows: StoredDocument[],
  userId: string,
): Promise<DocumentItem[]> => {
  const entities = rows.map(storedEntity);
  const available = new Map<DocumentEntityType, Set<string>>();

  await Promise.all(
    documentEntityTypes.map(async type => {
      const ids = [...new Set(entities.filter(entity => entity?.type === type).map(entity => entity!.id))];
      if (ids.length) {
        available.set(type, new Set((await availableEntities(tx, type, ids, userId)).map(row => row.id)));
      }
    }),
  );

  return rows.map((doc, index) => {
    const entity = entities[index] ?? null;
    const isAvailable = entity ? (available.get(entity.type)?.has(entity.id) ?? false) : null;
    const versions = doc.versions ?? [];
    const currentVersion: DocumentVersionItem | null = versions[0] ?? null;
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

