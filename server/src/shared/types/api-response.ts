export interface ApiResponseBase {
  success: boolean;
}

export interface ApiSuccessResponse<TData = unknown> extends ApiResponseBase {
  success: true;
  data?: TData;
  error?: never;
  details?: never;
}

export interface ApiErrorResponse {
  success: false;
  data?: never;
  error: string;
  code: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type PaginatedResponse<TData = unknown> = ApiSuccessResponse<TData[]> & {
  meta: PaginationMeta;
};

export type ApiResponse<TData = unknown> =
  | ApiSuccessResponse<TData>
  | ApiErrorResponse;
