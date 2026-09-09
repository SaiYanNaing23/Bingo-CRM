import type { Prisma } from "../../../generated/prisma/client";
import type { NoteEntity } from "../dto/notes.dto";
export declare const noteSelect: {
    readonly id: true;
    readonly userId: true;
    readonly title: true;
    readonly content: true;
    readonly tags: true;
    readonly companyId: true;
    readonly contactId: true;
    readonly applicationId: true;
    readonly taskId: true;
    readonly projectId: true;
    readonly createdAt: true;
    readonly updatedAt: true;
    readonly deletedAt: true;
};
export type StoredNote = Prisma.NoteGetPayload<{
    select: typeof noteSelect;
}>;
export type Note = Omit<StoredNote, "companyId" | "contactId" | "applicationId" | "taskId" | "projectId"> & {
    entity: NoteEntity | null;
    entityAvailable: boolean | null;
};
//# sourceMappingURL=notes.types.d.ts.map