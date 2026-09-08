import { z } from "zod";
export declare const createContactSchema: z.ZodObject<{
    photo: z.ZodURL;
    name: z.ZodString;
    companyId: z.ZodString;
    email: z.ZodEmail;
    phone: z.ZodString;
    linkedIn: z.ZodURL;
    role: z.ZodString;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lastContactAt: z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>;
    nextFollowUpAt: z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>;
}, z.core.$strip>;
export declare const updateContactSchema: z.ZodObject<{
    photo: z.ZodOptional<z.ZodURL>;
    name: z.ZodOptional<z.ZodString>;
    companyId: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodEmail>;
    phone: z.ZodOptional<z.ZodString>;
    linkedIn: z.ZodOptional<z.ZodURL>;
    role: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    lastContactAt: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    nextFollowUpAt: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
}, z.core.$strip>;
export declare const contactListQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    companyId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        name: "name";
        lastContactAt: "lastContactAt";
    }>>>;
    order: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>;
}, z.core.$strip>;
export declare const contactFollowUpUpdateSchema: z.ZodObject<{
    lastContactAt: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
    nextFollowUpAt: z.ZodOptional<z.ZodPipe<z.ZodISODateTime, z.ZodCoercedDate<string>>>;
}, z.core.$strip>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactListQueryInput = z.infer<typeof contactListQuerySchema>;
export type ContactFollowUpUpdateInput = z.infer<typeof contactFollowUpUpdateSchema>;
//# sourceMappingURL=contacts.dto.d.ts.map