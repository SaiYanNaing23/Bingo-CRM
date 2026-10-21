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
export declare class MetadataStorageService implements IStorageService {
    readonly providerName = "METADATA";
    uploadFile(metadata: {
        fileName: string;
        mimeType: string;
        fileSize: number;
        fileUrl?: string;
    }): Promise<StorageUploadResult>;
    deleteFile(_storageKey: string): Promise<boolean>;
}
export declare const defaultStorageService: MetadataStorageService;
//# sourceMappingURL=storage.service.d.ts.map