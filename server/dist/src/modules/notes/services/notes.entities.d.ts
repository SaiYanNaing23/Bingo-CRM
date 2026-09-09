import { Prisma } from "../../../generated/prisma/client";
import { type NoteEntity, type NoteEntityType } from "../dto/notes.dto";
import type { Note, StoredNote } from "../types/notes.types";
export declare const entityColumns: {
    readonly COMPANY: "companyId";
    readonly CONTACT: "contactId";
    readonly APPLICATION: "applicationId";
    readonly TASK: "taskId";
    readonly PROJECT: "projectId";
};
type EntityColumn = typeof entityColumns[NoteEntityType];
export declare const entityFields: (entity: NoteEntity | null) => Record<EntityColumn, string | null>;
export declare const requireNoteEntity: (tx: Prisma.TransactionClient, entity: NoteEntity, userId: string) => Promise<void>;
export declare const serializeNotes: (tx: Prisma.TransactionClient, rows: StoredNote[], userId: string) => Promise<Note[]>;
export {};
//# sourceMappingURL=notes.entities.d.ts.map