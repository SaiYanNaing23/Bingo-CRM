export declare const validateCreateNote: (input: unknown) => {
    tags: string[];
    entity: {
        type: "PROJECT" | "COMPANY" | "CONTACT" | "APPLICATION" | "TASK";
        id: string;
    } | null;
    title: string;
    content: string;
};
export declare const validateUpdateNote: (input: unknown) => {
    title?: string | undefined;
    content?: string | undefined;
    tags?: string[] | undefined;
    entity?: {
        type: "PROJECT" | "COMPANY" | "CONTACT" | "APPLICATION" | "TASK";
        id: string;
    } | null | undefined;
};
export declare const validateNoteId: (input: unknown) => string;
export declare const validateNoteListQuery: (input: unknown) => {
    sortBy: "createdAt" | "updatedAt" | "title";
    order: "asc" | "desc";
    page?: number | undefined;
    limit?: number | undefined;
    tag?: string | undefined;
    search?: string | undefined;
    entityType?: "PROJECT" | "COMPANY" | "CONTACT" | "APPLICATION" | "TASK" | undefined;
    entityId?: string | undefined;
};
//# sourceMappingURL=notes.validators.d.ts.map