"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactFollowUpUpdateSchema = exports.contactListQuerySchema = exports.updateContactSchema = exports.createContactSchema = void 0;
const zod_1 = require("zod");
const followUpDate = zod_1.z.iso.datetime({ offset: true }).pipe(zod_1.z.coerce.date());
exports.createContactSchema = zod_1.z.object({
    photo: zod_1.z.url("Invalid photo URL").trim().min(1),
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters"),
    companyId: zod_1.z.string().trim().min(1, "Company is required"),
    email: zod_1.z.email("Invalid email"),
    phone: zod_1.z.string().trim().min(5, "Phone must be at least 5 characters"),
    linkedIn: zod_1.z.url("Invalid LinkedIn URL"),
    role: zod_1.z.string().trim().min(2, "Role must be at least 2 characters"),
    notes: zod_1.z.string().trim().nullable().optional(),
    lastContactAt: followUpDate,
    nextFollowUpAt: followUpDate,
});
exports.updateContactSchema = exports.createContactSchema.partial();
exports.contactListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().optional(),
    companyId: zod_1.z.string().trim().optional(),
    search: zod_1.z.string().trim().optional(),
    sortBy: zod_1.z.enum(["name", "lastContactAt", "createdAt", "updatedAt"]).default("updatedAt").optional(),
    order: zod_1.z.enum(["asc", "desc"]).default("desc").optional(),
});
exports.contactFollowUpUpdateSchema = zod_1.z
    .object({
    lastContactAt: followUpDate.optional(),
    nextFollowUpAt: followUpDate.optional(),
})
    .refine((value) => value.lastContactAt !== undefined || value.nextFollowUpAt !== undefined, {
    message: "At least one follow-up field is required",
    path: ["lastContactAt"],
});
//# sourceMappingURL=contacts.dto.js.map