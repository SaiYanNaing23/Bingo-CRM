import { createUploadthing, type FileRouter } from "uploadthing/express";
import { UploadThingError } from "uploadthing/server";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";

const f = createUploadthing();

export const uploadRouter: FileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "32MB" },
    text: { maxFileSize: "16MB" },
    image: { maxFileSize: "16MB" },
    blob: { maxFileSize: "32MB" },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw new UploadThingError("Authentication required to upload files");
      }
      const token = authHeader.slice(7);
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
        return { userId: decoded.sub };
      } catch {
        throw new UploadThingError("Invalid or expired authentication token");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const fileData = file as unknown as {
        ufsUrl?: string;
        url?: string;
        name: string;
        size: number;
        key: string;
        type: string;
      };
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

export type OurFileRouter = typeof uploadRouter;

