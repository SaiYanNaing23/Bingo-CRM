import { z } from "zod";

const followUpDate = z.iso.datetime({ offset: true }).pipe(z.coerce.date());

export const createContactSchema = z.object({
  photo: z.url("Invalid photo URL").trim().min(1),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  companyId: z.string().trim().min(1, "Company is required"),
  email: z.email("Invalid email"),
  phone: z.string().trim().min(5, "Phone must be at least 5 characters"),
  linkedIn: z.url("Invalid LinkedIn URL"),
  role: z.string().trim().min(2, "Role must be at least 2 characters"),
  notes: z.string().trim().nullable().optional(),
  lastContactAt: followUpDate,
  nextFollowUpAt: followUpDate,
});

export const updateContactSchema = createContactSchema.partial();

export const contactListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  companyId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["name", "lastContactAt", "createdAt", "updatedAt"]).default("updatedAt").optional(),
  order: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const contactFollowUpUpdateSchema = z
  .object({
    lastContactAt: followUpDate.optional(),
    nextFollowUpAt: followUpDate.optional(),
  })
  .refine((value) => value.lastContactAt !== undefined || value.nextFollowUpAt !== undefined, {
    message: "At least one follow-up field is required",
    path: ["lastContactAt"],
  });

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactListQueryInput = z.infer<typeof contactListQuerySchema>;
export type ContactFollowUpUpdateInput = z.infer<typeof contactFollowUpUpdateSchema>;
