import type { CreateContactInput, UpdateContactInput, ContactListQueryInput, ContactFollowUpUpdateInput } from "../dto/contacts.dto";
import type { PaginationMeta } from "../../../shared/types/api-response";
import type { Contact } from "../types/contacts.types";
export declare const createContact: (input: CreateContactInput, userId: string) => Promise<Contact>;
export declare const listContacts: (query: ContactListQueryInput, userId: string) => Promise<{
    data: Contact[];
    meta: PaginationMeta;
}>;
export declare const getContact: (id: string, userId: string) => Promise<Contact>;
export declare const updateContact: (id: string, input: UpdateContactInput, userId: string) => Promise<Contact>;
export declare const deleteContact: (id: string, userId: string) => Promise<void>;
export declare const updateContactFollowUp: (id: string, input: ContactFollowUpUpdateInput, userId: string) => Promise<Contact>;
//# sourceMappingURL=contacts.service.d.ts.map