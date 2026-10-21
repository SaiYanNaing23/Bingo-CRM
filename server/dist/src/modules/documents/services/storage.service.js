"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultStorageService = exports.MetadataStorageService = void 0;
class MetadataStorageService {
    providerName = "METADATA";
    async uploadFile(metadata) {
        return {
            fileUrl: metadata.fileUrl || `metadata://${metadata.fileName}`,
            storageProvider: this.providerName,
            storageKey: undefined,
        };
    }
    async deleteFile(_storageKey) {
        // In metadata-first mode, no remote asset to physically remove
        return true;
    }
}
exports.MetadataStorageService = MetadataStorageService;
exports.defaultStorageService = new MetadataStorageService();
//# sourceMappingURL=storage.service.js.map