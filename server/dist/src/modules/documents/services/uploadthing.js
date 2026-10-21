"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("uploadthing/express");
const server_1 = require("uploadthing/server");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../../config/env");
const f = (0, express_1.createUploadthing)();
exports.uploadRouter = {
    documentUploader: f({
        pdf: { maxFileSize: "32MB" },
        text: { maxFileSize: "16MB" },
        image: { maxFileSize: "16MB" },
        blob: { maxFileSize: "32MB" },
    })
        .middleware(async ({ req }) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            throw new server_1.UploadThingError("Authentication required to upload files");
        }
        const token = authHeader.slice(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            return { userId: decoded.sub };
        }
        catch {
            throw new server_1.UploadThingError("Invalid or expired authentication token");
        }
    })
        .onUploadComplete(async ({ metadata, file }) => {
        const fileData = file;
        return {
            uploadedBy: metadata.userId,
            fileUrl: fileData.ufsUrl || fileData.url || "",
            fileName: fileData.name,
            fileSize: fileData.size,
            fileKey: fileData.key,
            mimeType: fileData.type,
        };
    }),
};
//# sourceMappingURL=uploadthing.js.map