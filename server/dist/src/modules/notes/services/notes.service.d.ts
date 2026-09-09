import type { CreateNoteInput, UpdateNoteInput, NoteListQuery } from "../dto/notes.dto";
export declare const createNote: (input: CreateNoteInput, userId: string) => Promise<import("../types/notes.types").Note>;
export declare const getNote: (id: string, userId: string) => Promise<import("../types/notes.types").Note>;
export declare const updateNote: (id: string, input: UpdateNoteInput, userId: string) => Promise<import("../types/notes.types").Note>;
export declare const deleteNote: (id: string, userId: string) => Promise<void>;
export declare const listNotes: (query: NoteListQuery, userId: string) => Promise<{
    data: import("../types/notes.types").Note[];
    meta: import("../../../shared/types/api-response").PaginationMeta;
}>;
//# sourceMappingURL=notes.service.d.ts.map