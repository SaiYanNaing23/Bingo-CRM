import { env } from "../../config/env";
import type { PaginationMeta } from "../types/api-response";

export type PaginationQuery = {
  page?: string | string[] | undefined;
  limit?: string | string[] | undefined;
};

export type PaginationState = {
  page: number;
  limit: number;
};

const toSingleValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
};

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(toSingleValue(value) ?? "", 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

export const parsePaginationQuery = (query: PaginationQuery): PaginationState => {
  const page = parsePositiveInt(query.page, 1);
  const requestedLimit = parsePositiveInt(query.limit, env.PAGINATION_DEFAULT_LIMIT);

  return {
    page,
    limit: Math.min(requestedLimit, env.PAGINATION_MAX_LIMIT),
  };
};

export const toPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
