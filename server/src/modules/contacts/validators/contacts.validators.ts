import type {
  ContactListQueryInput,
  CreateContactInput,
  UpdateContactInput,
  ContactFollowUpUpdateInput,
} from "../dto/contacts.dto";
import {
  contactListQuerySchema,
  contactFollowUpUpdateSchema,
  createContactSchema,
  updateContactSchema,
} from "../dto/contacts.dto";

export const validateCreateContact = (data: unknown): CreateContactInput =>
  createContactSchema.parse(data);

export const validateUpdateContact = (data: unknown): UpdateContactInput =>
  updateContactSchema.parse(data);

export const validateContactListQuery = (data: unknown): ContactListQueryInput =>
  contactListQuerySchema.parse(data);

export const validateContactFollowUpUpdate = (
  data: unknown
): ContactFollowUpUpdateInput => contactFollowUpUpdateSchema.parse(data);
