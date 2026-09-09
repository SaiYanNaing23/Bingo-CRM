"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNoteController = exports.updateNoteController = exports.getNoteController = exports.listNotesController = exports.createNoteController = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const response_1 = require("../../../shared/utils/response");
const service = __importStar(require("../services/notes.service"));
const validate = __importStar(require("../validators/notes.validators"));
const userId = (req) => {
    if (!req.user)
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    return req.user.id;
};
const noteId = (req) => validate.validateNoteId(req.params.id);
const createNoteController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.createNote(validate.validateCreateNote(req.body), userId(req)), 201);
};
exports.createNoteController = createNoteController;
const listNotesController = async (req, res) => {
    const result = await service.listNotes(validate.validateNoteListQuery(req.query), userId(req));
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listNotesController = listNotesController;
const getNoteController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.getNote(noteId(req), userId(req)));
};
exports.getNoteController = getNoteController;
const updateNoteController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.updateNote(noteId(req), validate.validateUpdateNote(req.body), userId(req)));
};
exports.updateNoteController = updateNoteController;
const deleteNoteController = async (req, res) => {
    const id = noteId(req);
    await service.deleteNote(id, userId(req));
    (0, response_1.sendSuccess)(res, { id, deleted: true });
};
exports.deleteNoteController = deleteNoteController;
//# sourceMappingURL=notes.controller.js.map