import type { PaginationMeta } from "../types/api-response";
export type PaginationQuery = {
    page?: string | string[] | undefined;
    limit?: string | string[] | undefined;
};
export type PaginationState = {
    page: number;
    limit: number;
};
export declare const parsePaginationQuery: (query: PaginationQuery) => PaginationState;
export declare const toPaginationMeta: (total: number, page: number, limit: number) => PaginationMeta;
//# sourceMappingURL=pagination.d.ts.map