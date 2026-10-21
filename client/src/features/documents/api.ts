import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/auth-context'
import { request } from '@/lib/api-client'
import type { Page, Params, Success } from '@/lib/api-types'
import type { CreateDocumentVersionInput, DocumentVersionItem } from './types'

export const listDocumentVersions = (documentId: string, params: Params, signal?: AbortSignal) =>
  request<Page<DocumentVersionItem>>(`/documents/${encodeURIComponent(documentId)}/versions`, {
    params,
    signal,
  })

export const addDocumentVersion = (documentId: string, body: CreateDocumentVersionInput) =>
  request<Success<DocumentVersionItem>>(`/documents/${encodeURIComponent(documentId)}/versions`, {
    method: 'POST',
    body: body as unknown as Record<string, unknown>,
  })

export const deleteDocumentVersion = (documentId: string, versionId: string) =>
  request<Success<{ id: string; deleted: true }>>(
    `/documents/${encodeURIComponent(documentId)}/versions/${encodeURIComponent(versionId)}`,
    {
      method: 'DELETE',
    },
  )

export function useDocumentVersions(documentId: string | undefined, params: Params, enabled = true) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['crm', user?.id, 'documents', documentId, 'versions', params],
    queryFn: ({ signal }) => listDocumentVersions(documentId!, params, signal),
    enabled: !!user && !!documentId && enabled,
  })
}

export function useAddDocumentVersion(documentId: string) {
  const { user } = useAuth()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateDocumentVersionInput) => addDocumentVersion(documentId, body),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['crm', user?.id, 'documents'] })
    },
  })
}

export function useDeleteDocumentVersion(documentId: string) {
  const { user } = useAuth()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (versionId: string) => deleteDocumentVersion(documentId, versionId),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['crm', user?.id, 'documents'] })
    },
  })
}

