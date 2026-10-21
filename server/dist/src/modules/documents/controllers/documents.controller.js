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
exports.deleteDocumentVersionController = exports.listDocumentVersionsController = exports.addDocumentVersionController = exports.deleteDocumentController = exports.updateDocumentController = exports.getDocumentController = exports.listDocumentsController = exports.createDocumentController = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const response_1 = require("../../../shared/utils/response");
const service = __importStar(require("../services/documents.service"));
const validate = __importStar(require("../validators/documents.validators"));
const userId = (req) => {
    if (!req.user)
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    return req.user.id;
};
const documentId = (req) => validate.validateDocumentId(req.params.id);
const versionId = (req) => validate.validateVersionId(req.params.versionId);
const createDocumentController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.createDocument(validate.validateCreateDocument(req.body), userId(req)), 201);
};
exports.createDocumentController = createDocumentController;
const listDocumentsController = async (req, res) => {
    const result = await service.listDocuments(validate.validateDocumentListQuery(req.query), userId(req));
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listDocumentsController = listDocumentsController;
const getDocumentController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.getDocument(documentId(req), userId(req)));
};
exports.getDocumentController = getDocumentController;
const updateDocumentController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.updateDocument(documentId(req), validate.validateUpdateDocument(req.body), userId(req)));
};
exports.updateDocumentController = updateDocumentController;
const deleteDocumentController = async (req, res) => {
    const id = documentId(req);
    await service.deleteDocument(id, userId(req));
    (0, response_1.sendSuccess)(res, { id, deleted: true });
};
exports.deleteDocumentController = deleteDocumentController;
const addDocumentVersionController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.addDocumentVersion(documentId(req), validate.validateCreateDocumentVersion(req.body), userId(req)), 201);
};
exports.addDocumentVersionController = addDocumentVersionController;
const listDocumentVersionsController = async (req, res) => {
    const result = await service.listDocumentVersions(documentId(req), validate.validateVersionListQuery(req.query), userId(req));
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listDocumentVersionsController = listDocumentVersionsController;
const deleteDocumentVersionController = async (req, res) => {
    const vId = versionId(req);
    await service.deleteDocumentVersion(documentId(req), vId, userId(req));
    (0, response_1.sendSuccess)(res, { id: vId, deleted: true });
};
exports.deleteDocumentVersionController = deleteDocumentVersionController;
//# sourceMappingURL=documents.controller.js.map