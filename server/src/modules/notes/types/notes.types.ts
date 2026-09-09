import type { Prisma } from "../../../generated/prisma/client";
import type { NoteEntity } from "../dto/notes.dto";

export const noteSelect = {
  id: true, userId: true, title: true, content: true, tags: true,
  companyId: true, contactId: true, applicationId: true, taskId: true, projectId: true,
  createdAt: true, updatedAt: true, deletedAt: true,
} as const satisfies Prisma.NoteSelect;

export type StoredNote = Prisma.NoteGetPayload<{ select: typeof noteSelect }>;
export type Note = Omit<StoredNote, "companyId" | "contactId" | "applicationId" | "taskId" | "projectId"> & {
  entity: NoteEntity | null;
  entityAvailable: boolean | null;
};
