import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../shared/errors/app-error";
import { omitUndefined } from "../../../shared/utils/omit-undefined";
import { parsePaginationQuery, toPaginationMeta } from "../../../shared/utils/pagination";
import { withActiveRecordFilter } from "../../../shared/utils/soft-delete";
import type {
  CreateDocumentInput,
  CreateDocumentVersionInput,
  DocumentListQuery,
  UpdateDocumentInput,
  VersionListQuery,
} from "../dto/documents.dto";
import {
  documentSelect,
  documentVersionSelect,
  type DocumentItem,
  type DocumentVersionItem,
  type StoredDocument,
} from "../types/documents.types";
import { entityColumns, entityFields, requireDocumentEntity, serializeDocuments } from "./documents.entities";

const notFound = () => new AppError("Document not found", 404, undefined, "DOCUMENT_NOT_FOUND");
const versionNotFound = () => new AppError("Document version not found", 404, undefined, "DOCUMENT_VERSION_NOT_FOUND");
const transactionOptions = { maxWait: 10000, timeout: 15000 };
const readOptions = { ...transactionOptions, isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead };

const withLockedDocument = <T>(id: string, userId: string, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> =>
  prisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Document"
      WHERE "id" = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
      FOR UPDATE
    `;
    if (!rows.length) throw notFound();
    return work(tx);
  }, transactionOptions);

export const createDocument = (input: CreateDocumentInput, userId: string): Promise<DocumentItem> =>
  prisma.$transaction(async tx => {
    const {
      title,
      type,
      description,
      tags,
      entity,
      fileName,
      fileSize,
      mimeType,
      fileUrl,
      storageProvider,
      storageKey,
      changelog,
    } = input;

    if (entity) await requireDocumentEntity(tx, entity, userId);

    const doc = await tx.document.create({
      data: {
        title,
        type,
        description: description ?? null,
        tags,
        userId,
        ...entityFields(entity),
      },
      select: documentSelect,
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
      select: documentVersionSelect,
    });

    const storedDoc: StoredDocument = {
      ...doc,
      versions: [initialVersion],
      _count: { versions: 1 },
    };

    return (await serializeDocuments(tx, [storedDoc], userId))[0]!;
  }, transactionOptions);

export const getDocument = (id: string, userId: string): Promise<DocumentItem> =>
  prisma.$transaction(async tx => {
    const doc = await tx.document.findFirst({
      where: withActiveRecordFilter({ id, userId }),
      select: {
        ...documentSelect,
        versions: {
          where: { deletedAt: null },
          orderBy: { version: "desc" },
          take: 1,
          select: documentVersionSelect,
        },
        _count: {
          select: { versions: { where: { deletedAt: null } } },
        },
      },
    });

    if (!doc) throw notFound();
    return (await serializeDocuments(tx, [doc as unknown as StoredDocument], userId))[0]!;
  }, readOptions);

export const updateDocument = (id: string, input: UpdateDocumentInput, userId: string): Promise<DocumentItem> =>
  withLockedDocument(id, userId, async tx => {
    const { entity, ...fields } = input;
    if (entity) await requireDocumentEntity(tx, entity, userId);

    const doc = await tx.document.update({
      where: { id },
      data: {
        ...omitUndefined(fields),
        ...(entity === undefined ? {} : entityFields(entity)),
      },
      select: {
        ...documentSelect,
        versions: {
          where: { deletedAt: null },
          orderBy: { version: "desc" },
          take: 1,
          select: documentVersionSelect,
        },
        _count: {
          select: { versions: { where: { deletedAt: null } } },
        },
      },
    });

    return (await serializeDocuments(tx, [doc as unknown as StoredDocument], userId))[0]!;
  });

export const deleteDocument = async (id: string, userId: string): Promise<void> => {
  await withLockedDocument(id, userId, async tx => {
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

export const listDocuments = async (query: DocumentListQuery, userId: string) => {
  const { page, limit } = parsePaginationQuery({ page: query.page?.toString(), limit: query.limit?.toString() });
  const where: Prisma.DocumentWhereInput = withActiveRecordFilter({ userId });

  if (query.type) where.type = query.type;
  if (query.tag) where.tags = { has: query.tag };
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.entityType && query.entityId) {
    where[entityColumns[query.entityType]] = query.entityId;
  }

  return prisma.$transaction(async tx => {
    const [total, rows] = await Promise.all([
      tx.document.count({ where }),
      tx.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ [query.sortBy]: query.order }, { id: "asc" }],
        select: {
          ...documentSelect,
          versions: {
            where: { deletedAt: null },
            orderBy: { version: "desc" },
            take: 1,
            select: documentVersionSelect,
          },
          _count: {
            select: { versions: { where: { deletedAt: null } } },
          },
        },
      }),
    ]);

    const data = await serializeDocuments(tx, rows as unknown as StoredDocument[], userId);
    return { data, meta: toPaginationMeta(total, page, limit) };
  }, readOptions);
};

export const addDocumentVersion = (
  documentId: string,
  input: CreateDocumentVersionInput,
  userId: string,
): Promise<DocumentVersionItem> =>
  withLockedDocument(documentId, userId, async tx => {
    const rows = await tx.$queryRaw<{ max_version: number | null }[]>`
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
      select: documentVersionSelect,
    });

    await tx.document.update({
      where: { id: documentId },
      data: { updatedAt: new Date() },
      select: { id: true },
    });

    return version;
  });

export const listDocumentVersions = async (documentId: string, query: VersionListQuery, userId: string) => {
  const { page, limit } = parsePaginationQuery({ page: query.page?.toString(), limit: query.limit?.toString() });

  return prisma.$transaction(async tx => {
    const doc = await tx.document.findFirst({
      where: withActiveRecordFilter({ id: documentId, userId }),
      select: { id: true },
    });
    if (!doc) throw notFound();

    const where: Prisma.DocumentVersionWhereInput = {
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
        select: documentVersionSelect,
      }),
    ]);

    return { data: rows, meta: toPaginationMeta(total, page, limit) };
  }, readOptions);
};

export const deleteDocumentVersion = async (
  documentId: string,
  versionId: string,
  userId: string,
): Promise<void> => {
  await withLockedDocument(documentId, userId, async tx => {
    const targetVersion = await tx.documentVersion.findFirst({
      where: { id: versionId, documentId, deletedAt: null },
      select: { id: true },
    });
    if (!targetVersion) throw versionNotFound();

    const remainingActive = await tx.documentVersion.count({
      where: { documentId, deletedAt: null },
    });

    if (remainingActive <= 1) {
      throw new AppError(
        "Cannot delete the only active version of a document. Delete the document instead.",
        400,
        undefined,
        "CANNOT_DELETE_ONLY_VERSION",
      );
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
