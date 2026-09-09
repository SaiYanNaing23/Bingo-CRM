"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNoteListQuery = exports.validateNoteId = exports.validateUpdateNote = exports.validateCreateNote = void 0;
const notes_dto_1 = require("../dto/notes.dto");
const validateCreateNote = (input) => notes_dto_1.createNoteSchema.parse(input);
exports.validateCreateNote = validateCreateNote;
const validateUpdateNote = (input) => notes_dto_1.updateNoteSchema.parse(input);
exports.validateUpdateNote = validateUpdateNote;
const validateNoteId = (input) => notes_dto_1.noteIdSchema.parse(input);
exports.validateNoteId = validateNoteId;
const validateNoteListQuery = (input) => notes_dto_1.noteListQuerySchema.parse(input);
exports.validateNoteListQuery = validateNoteListQuery;
//# sourceMappingURL=notes.validators.js.map