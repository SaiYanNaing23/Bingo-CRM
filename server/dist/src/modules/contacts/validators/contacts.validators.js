"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContactFollowUpUpdate = exports.validateContactListQuery = exports.validateUpdateContact = exports.validateCreateContact = void 0;
const contacts_dto_1 = require("../dto/contacts.dto");
const validateCreateContact = (data) => contacts_dto_1.createContactSchema.parse(data);
exports.validateCreateContact = validateCreateContact;
const validateUpdateContact = (data) => contacts_dto_1.updateContactSchema.parse(data);
exports.validateUpdateContact = validateUpdateContact;
const validateContactListQuery = (data) => contacts_dto_1.contactListQuerySchema.parse(data);
exports.validateContactListQuery = validateContactListQuery;
const validateContactFollowUpUpdate = (data) => contacts_dto_1.contactFollowUpUpdateSchema.parse(data);
exports.validateContactFollowUpUpdate = validateContactFollowUpUpdate;
//# sourceMappingURL=contacts.validators.js.map