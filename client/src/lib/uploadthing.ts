import {
  generateUploadButton,
  generateUploadDropzone,
  generateUploader,
} from '@uploadthing/react'
import type { FileRouter } from 'uploadthing/types'
import { apiBase } from './api-client'
import { session } from './session'

export const uploadthingUrl = `${apiBase}/uploadthing`

export interface DocumentUploadResult {
  uploadedBy: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileKey: string
  mimeType: string
}

export type OurFileRouter = FileRouter

const customFetch: typeof fetch = (input, init) => {
  const token = session.token()
  if (token && input.toString().includes('/uploadthing')) {
    const headers = new Headers(init?.headers)
    headers.set('Authorization', `Bearer ${token}`)
    return fetch(input, { ...init, headers })
  }
  return fetch(input, init)
}

export const UploadDropzone = generateUploadDropzone<FileRouter>({
  url: uploadthingUrl,
  fetch: customFetch,
})

export const UploadButton = generateUploadButton<FileRouter>({
  url: uploadthingUrl,
  fetch: customFetch,
})

export const Uploader = generateUploader<FileRouter>({
  url: uploadthingUrl,
  fetch: customFetch,
})

