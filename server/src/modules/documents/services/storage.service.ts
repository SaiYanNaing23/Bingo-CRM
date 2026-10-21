export interface StorageUploadResult {
  fileUrl: string;
  storageProvider: string;
  storageKey?: string | undefined;
}

export interface IStorageService {
  uploadFile(metadata: {
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileUrl?: string;
  }): Promise<StorageUploadResult>;
  deleteFile(storageKey: string): Promise<boolean>;
}

export class MetadataStorageService implements IStorageService {
  readonly providerName = "METADATA";

  async uploadFile(metadata: {
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileUrl?: string;
  }): Promise<StorageUploadResult> {
    return {
      fileUrl: metadata.fileUrl || `metadata://${metadata.fileName}`,
      storageProvider: this.providerName,
      storageKey: undefined,
    };
  }

  async deleteFile(_storageKey: string): Promise<boolean> {
    // In metadata-first mode, no remote asset to physically remove
    return true;
  }
}

export const defaultStorageService = new MetadataStorageService();

