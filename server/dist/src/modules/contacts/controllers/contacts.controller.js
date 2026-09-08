"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContactFollowUpController = exports.deleteContactController = exports.updateContactController = exports.getContactController = exports.listContactsController = exports.createContactController = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const response_1 = require("../../../shared/utils/response");
const contacts_service_1 = require("../services/contacts.service");
const contacts_validators_1 = require("../validators/contacts.validators");
const createContactController = async (req, res) => {
    const payload = (0, contacts_validators_1.validateCreateContact)(req.body);
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const result = await (0, contacts_service_1.createContact)(payload, userId);
    (0, response_1.sendSuccess)(res, result, 201);
};
exports.createContactController = createContactController;
const listContactsController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const query = (0, contacts_validators_1.validateContactListQuery)(req.query);
    const result = await (0, contacts_service_1.listContacts)(query, userId);
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listContactsController = listContactsController;
const getContactController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const result = await (0, contacts_service_1.getContact)(id, userId);
    (0, response_1.sendSuccess)(res, result);
};
exports.getContactController = getContactController;
const updateContactController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const payload = (0, contacts_validators_1.validateUpdateContact)(req.body);
    const result = await (0, contacts_service_1.updateContact)(id, payload, userId);
    (0, response_1.sendSuccess)(res, result);
};
exports.updateContactController = updateContactController;
const deleteContactController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    await (0, contacts_service_1.deleteContact)(id, userId);
    (0, response_1.sendSuccess)(res, { message: "Contact deleted" });
};
exports.deleteContactController = deleteContactController;
const updateContactFollowUpController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const payload = (0, contacts_validators_1.validateContactFollowUpUpdate)(req.body);
    const result = await (0, contacts_service_1.updateContactFollowUp)(id, payload, userId);
    (0, response_1.sendSuccess)(res, result);
};
exports.updateContactFollowUpController = updateContactFollowUpController;
//# sourceMappingURL=contacts.controller.js.map