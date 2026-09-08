import type {
  CreateContactInput,
  UpdateContactInput,
  ContactListQueryInput,
  ContactFollowUpUpdateInput,
} from "../dto/contacts.dto";
import { parsePaginationQuery, toPaginationMeta } from "../../../shared/utils/pagination";
import { AppError } from "../../../shared/errors/app-error";
import { withActiveRecordFilter } from "../../../shared/utils/soft-delete";
import { prisma } from "../../../lib/prisma";
import type { PaginationMeta } from "../../../shared/types/api-response";
import type { Contact } from "../types/contacts.types";

type ContactWhereInput = Record<string, unknown>;
type ContactOrderByInput = Record<string, "asc" | "desc">;
type ContactSelectInput = Record<string, boolean>;

type ContactDelegate = {
  create: (args: { data: Record<string, unknown>; select?: ContactSelectInput }) => Promise<unknown>;
  findFirst: (args: {
    where?: ContactWhereInput;
    select?: ContactSelectInput;
  }) => Promise<unknown>;
  findMany: (args: {
    where?: ContactWhereInput;
    skip?: number;
    take?: number;
    orderBy?: ContactOrderByInput | ContactOrderByInput[];
    select?: ContactSelectInput;
  }) => Promise<unknown[]>;
  count: (args: { where?: ContactWhereInput }) => Promise<number>;
  update: (args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
    select?: ContactSelectInput;
  }) => Promise<unknown>;
};

type CompanyDelegate = {
  findFirst: (args: {
    where?: ContactWhereInput;
    select?: Record<string, boolean>;
  }) => Promise<unknown>;
};

const db = prisma as unknown as {
  contact: ContactDelegate;
  company: CompanyDelegate;
};

const contactSelect = {
  id: true,
  userId: true,
  companyId: true,
  photo: true,
  name: true,
  email: true,
  phone: true,
  linkedIn: true,
  role: true,
  notes: true,
  lastContactAt: true,
  nextFollowUpAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const satisfies ContactSelectInput;

const contactNotFoundError = (): AppError => {
  return new AppError("Contact not found", 404, undefined, "CONTACT_NOT_FOUND");
};

const companyNotFoundForUserError = (): AppError => {
  return new AppError("Company not found", 404, undefined, "CONTACT_COMPANY_NOT_FOUND");
};

const ensureCompanyOwnership = async (companyId: string, userId: string): Promise<void> => {
  const existing = await db.company.findFirst({
    where: withActiveRecordFilter({ id: companyId, userId }),
    select: { id: true },
  });

  if (!existing) {
    throw companyNotFoundForUserError();
  }
};

export const createContact = async (
  input: CreateContactInput,
  userId: string
): Promise<Contact> => {
  await ensureCompanyOwnership(input.companyId, userId);

  const created = await db.contact.create({
    data: {
      ...input,
      userId,
    },
    select: contactSelect,
  });

  return created as Contact;
};

export const listContacts = async (
  query: ContactListQueryInput,
  userId: string
): Promise<{ data: Contact[]; meta: PaginationMeta }> => {
  const { page, limit } = parsePaginationQuery({
    page: query.page?.toString(),
    limit: query.limit?.toString(),
  });

  const searchQuery = query.search?.trim();
  const where: ContactWhereInput = withActiveRecordFilter({ userId });

  if (query.companyId) {
    Object.assign(where, { companyId: query.companyId });
  }

  if (searchQuery) {
    Object.assign(where, {
      OR: [
        {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          role: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          notes: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  const orderBy = {
    [query.sortBy ?? "updatedAt"]: query.order ?? "desc",
  } as ContactOrderByInput;

  const [total, data] = await Promise.all([
    db.contact.count({ where }),
    db.contact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      select: contactSelect,
    }),
  ]);

  return {
    data: data as Contact[],
    meta: toPaginationMeta(total, page, limit),
  };
};

export const getContact = async (id: string, userId: string): Promise<Contact> => {
  const where: ContactWhereInput = withActiveRecordFilter({ id, userId });
  const contact = await db.contact.findFirst({
    where,
    select: contactSelect,
  });

  if (!contact) {
    throw contactNotFoundError();
  }

  return contact as Contact;
};

export const updateContact = async (
  id: string,
  input: UpdateContactInput,
  userId: string
): Promise<Contact> => {
  const where = withActiveRecordFilter({ id, userId });

  const existing = await db.contact.findFirst({
    where,
    select: { id: true },
  });

  if (!existing) {
    throw contactNotFoundError();
  }

  if (input.companyId !== undefined) {
    await ensureCompanyOwnership(input.companyId, userId);
  }

  const updated = await db.contact.update({
    where: { id },
    data: input,
    select: contactSelect,
  });

  return updated as Contact;
};

export const deleteContact = async (id: string, userId: string): Promise<void> => {
  const where = withActiveRecordFilter({ id, userId });

  const existing = await db.contact.findFirst({
    where,
    select: { id: true },
  });

  if (!existing) {
    throw contactNotFoundError();
  }

  await db.contact.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
    select: { id: true },
  });
};

export const updateContactFollowUp = async (
  id: string,
  input: ContactFollowUpUpdateInput,
  userId: string
): Promise<Contact> => {
  const where = withActiveRecordFilter({ id, userId });

  const existing = await db.contact.findFirst({
    where,
    select: { id: true },
  });

  if (!existing) {
    throw contactNotFoundError();
  }

  const updated = await db.contact.update({
    where: { id },
    data: input,
    select: contactSelect,
  });

  return updated as Contact;
};
