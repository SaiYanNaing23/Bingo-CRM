import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/auth-context'
import { request } from './api-client'
import type { Page, Params, Success } from './api-types'
import type { Company } from '@/features/companies/types'
import type { Contact } from '@/features/contacts/types'
import type { Application } from '@/features/applications/types'
import type { Task } from '@/features/tasks/types'
import type { Project } from '@/features/projects/types'
import type { Note } from '@/features/notes/types'
export interface ResourceMap {
  companies: Company
  contacts: Contact
  applications: Application
  tasks: Task
  projects: Project
  notes: Note
}
export type Kind = keyof ResourceMap
export type Entity = ResourceMap[Kind]
export const valueOf = (record: Entity, key: string): unknown => Reflect.get(record, key)
export const titleOf = (record: Entity) =>
  String(valueOf(record, 'name') ?? valueOf(record, 'position') ?? valueOf(record, 'title'))
export function resourceApi<K extends Kind>(kind: K) {
  return {
    list: (params: Params, signal?: AbortSignal) =>
      request<Page<ResourceMap[K]>>(`/${kind}`, { params, signal }),
    get: (id: string, signal?: AbortSignal) =>
      request<Success<ResourceMap[K]>>(`/${kind}/${encodeURIComponent(id)}`, { signal }),
    create: (body: Record<string, unknown>) =>
      request<Success<ResourceMap[K]>>(`/${kind}`, { method: 'POST', body }),
    update: (id: string, body: Record<string, unknown>) =>
      request<Success<ResourceMap[K]>>(`/${kind}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body,
      }),
  }
}
export function useRecords<K extends Kind>(kind: K, params: Params, enabled = true) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['crm', user?.id, kind, 'list', params],
    queryFn: ({ signal }) => resourceApi(kind).list(params, signal),
    enabled: !!user && enabled,
  })
}
export function useRecord<K extends Kind>(kind: K, id?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['crm', user?.id, kind, 'detail', id],
    queryFn: ({ signal }) => resourceApi(kind).get(id!, signal),
    enabled: !!user && !!id,
  })
}
export function useWrite<T, V>(work: (values: V) => Promise<T>) {
  const { user } = useAuth()
  const client = useQueryClient()
  return useMutation({
    mutationFn: work,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['crm', user?.id] })
    },
  })
}
