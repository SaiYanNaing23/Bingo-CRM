"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVersionListQuery = exports.validateDocumentListQuery = exports.validateCreateDocumentVersion = exports.validateUpdateDocument = exports.validateCreateDocument = exports.validateVersionId = exports.validateDocumentId = void 0;
const documents_dto_1 = require("../dto/documents.dto");
const validateDocumentId = (id) => documents_dto_1.documentIdSchema.parse(id);
exports.validateDocumentId = validateDocumentId;
const validateVersionId = (id) => documents_dto_1.versionIdSchema.parse(id);
exports.validateVersionId = validateVersionId;
const validateCreateDocument = (body) => documents_dto_1.createDocumentSchema.parse(body);
exports.validateCreateDocument = validateCreateDocument;
const validateUpdateDocument = (body) => documents_dto_1.updateDocumentSchema.parse(body);
exports.validateUpdateDocument = validateUpdateDocument;
const validateCreateDocumentVersion = (body) => documents_dto_1.createDocumentVersionSchema.parse(body);
exports.validateCreateDocumentVersion = validateCreateDocumentVersion;
const validateDocumentListQuery = (query) => documents_dto_1.documentListQuerySchema.parse(query);
exports.validateDocumentListQuery = validateDocumentListQuery;
const validateVersionListQuery = (query) => documents_dto_1.versionListQuerySchema.parse(query);
exports.validateVersionListQuery = validateVersionListQuery;
//# sourceMappingURL=documents.validators.js.map