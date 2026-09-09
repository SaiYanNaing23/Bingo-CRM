import { z } from "zod";
export declare const noteEntityTypes: readonly ["COMPANY", "CONTACT", "APPLICATION", "TASK", "PROJECT"];
export declare const noteEntityTypeSchema: z.ZodEnum<{
    PROJECT: "PROJECT";
    COMPANY: "COMPANY";
    CONTACT: "CONTACT";
    APPLICATION: "APPLICATION";
    TASK: "TASK";
}>;
export declare const noteEntitySchema: z.ZodObject<{
    type: z.ZodEnum<{
        PROJECT: "PROJECT";
        COMPANY: "COMPANY";
        CONTACT: "CONTACT";
        APPLICATION: "APPLICATION";
        TASK: "TASK";
    }>;
    id: z.ZodUUID;
}, z.core.$strict>;
export declare const createNoteSchema: z.ZodObject<{
    tags: z.ZodDefault<z.ZodPipe<z.ZodArray<z.ZodString>, z.ZodTransform<string[], string[]>>>;
    entity: z.ZodDefault<z.ZodNullable<z.ZodObject<{
        type: z.ZodEnum<{
            PROJECT: "PROJECT";
            COMPANY: "COMPANY";
            CONTACT: "CONTACT";
            APPLICATION: "APPLICATION";
            TASK: "TASK";
        }>;
        id: z.ZodUUID;
    }, z.core.$strict>>>;
    title: z.ZodString;
    content: z.ZodString;
}, z.core.$strict>;
export declare const updateNoteSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodPipe<z.ZodArray<z.ZodString>, z.ZodTransform<string[], string[]>>>;
    entity: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        type: z.ZodEnum<{
            PROJECT: "PROJECT";
            COMPANY: "COMPANY";
            CONTACT: "CONTACT";
            APPLICATION: "APPLICATION";
            TASK: "TASK";
        }>;
        id: z.ZodUUID;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export declare const noteIdSchema: z.ZodUUID;
export declare const noteListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>, z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodCoercedNumber<string>>>;
    tag: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    entityType: z.ZodOptional<z.ZodEnum<{
        PROJECT: "PROJECT";
        COMPANY: "COMPANY";
        CONTACT: "CONTACT";
        APPLICATION: "APPLICATION";
        TASK: "TASK";
    }>>;
    entityId: z.ZodOptional<z.ZodUUID>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        title: "title";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strict>;
export type NoteEntityType = z.infer<typeof noteEntityTypeSchema>;
export type NoteEntity = z.infer<typeof noteEntitySchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteListQuery = z.infer<typeof noteListQuerySchema>;
//# sourceMappingURL=notes.dto.d.ts.map