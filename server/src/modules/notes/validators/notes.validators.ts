import { createNoteSchema, updateNoteSchema, noteIdSchema, noteListQuerySchema } from "../dto/notes.dto";

export const validateCreateNote = (input: unknown) => createNoteSchema.parse(input);
export const validateUpdateNote = (input: unknown) => updateNoteSchema.parse(input);
export const validateNoteId = (input: unknown) => noteIdSchema.parse(input);
export const validateNoteListQuery = (input: unknown) => noteListQuerySchema.parse(input);
