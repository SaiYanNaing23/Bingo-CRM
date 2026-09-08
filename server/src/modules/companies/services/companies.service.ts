import type {
  CreateCompanyInput,
  UpdateCompanyInput,
  CompanyListQueryInput,
  CompanyStatusTransitionInput,
} from "../dto/companies.dto";
import { parsePaginationQuery, toPaginationMeta } from "../../../shared/utils/pagination";
import { AppError } from "../../../shared/errors/app-error";
import { withActiveRecordFilter } from "../../../shared/utils/soft-delete";
import { omitUndefined } from "../../../shared/utils/omit-undefined";
import { prisma } from "../../../lib/prisma";
import type { Prisma } from "../../../generated/prisma/client";
import type { PaginationMeta } from "../../../shared/types/api-response";

type CompanyRecord = Prisma.CompanyGetPayload<{
  select: typeof companySelect;
}>;

const companySelect = {
  id: true,
  userId: true,
  logo: true,
  name: true,
  country: true,
  industry: true,
  website: true,
  linkedIn: true,
  careerPage: true,
  techStack: true,
  size: true,
  salaryRange: true,
  remote: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.CompanySelect;

const companyNotFoundError = (): AppError => {
  return new AppError("Company not found", 404, undefined, "COMPANY_NOT_FOUND");
};

export const createCompany = async (
  input: CreateCompanyInput,
  userId: string
): Promise<CompanyRecord> => {
  return prisma.company.create({
    data: {
      ...omitUndefined(input),
      userId,
    },
    select: companySelect,
  });
};

export const listCompanies = async (
  query: CompanyListQueryInput,
  userId: string
): Promise<{ data: CompanyRecord[]; meta: PaginationMeta }> => {
  const { page, limit } = parsePaginationQuery({
    page: query.page?.toString(),
    limit: query.limit?.toString(),
  });

  const searchQuery = query.search?.trim();
  const where = withActiveRecordFilter<Prisma.CompanyWhereInput>(omitUndefined({
    userId,
    status: query.status,
    country: query.country,
    industry: query.industry,
    remote: query.remote,
    ...(searchQuery
      ? {
          OR: [
            {
              name: {
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
        }
      : {}),
  }));

  const orderBy = {
    [query.sortBy ?? "createdAt"]: query.order ?? "desc",
  } as Prisma.CompanyOrderByWithRelationInput;

  const [total, data] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      select: companySelect,
    }),
  ]);

  return { data, meta: toPaginationMeta(total, page, limit) };
};

export const getCompany = async (id: string, userId: string): Promise<CompanyRecord> => {
  const company = await prisma.company.findFirst({
    where: withActiveRecordFilter({ id, userId }),
    select: companySelect,
  });

  if (!company) {
    throw companyNotFoundError();
  }

  return company;
};

export const updateCompany = async (
  id: string,
  input: UpdateCompanyInput,
  userId: string
): Promise<CompanyRecord> => {
  const existing = await prisma.company.findFirst({
    where: withActiveRecordFilter({ id, userId }),
    select: { id: true },
  });

  if (!existing) {
    throw companyNotFoundError();
  }

  return prisma.company.update({
    where: { id },
    data: omitUndefined(input),
    select: companySelect,
  });
};

export const deleteCompany = async (id: string, userId: string): Promise<void> => {
  const existing = await prisma.company.findFirst({
    where: withActiveRecordFilter({ id, userId }),
    select: { id: true },
  });

  if (!existing) {
    throw companyNotFoundError();
  }

  await prisma.company.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
    select: { id: true },
  });
};

export const transitionCompanyStatus = async (
  id: string,
  payload: CompanyStatusTransitionInput,
  userId: string
): Promise<CompanyRecord> => {
  const existing = await prisma.company.findFirst({
    where: withActiveRecordFilter({ id, userId }),
    select: { id: true },
  });

  if (!existing) {
    throw companyNotFoundError();
  }

  return prisma.company.update({
    where: { id },
    data: {
      status: payload.status,
    },
    select: companySelect,
  });
};
