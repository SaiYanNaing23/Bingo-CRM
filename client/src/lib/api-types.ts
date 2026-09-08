export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
export interface Success<T> {
  success: true
  data: T
}
export interface Page<T> extends Success<T[]> {
  meta: PageMeta
}
export interface RecordBase {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
export type Params = Record<string, string | number | undefined>
