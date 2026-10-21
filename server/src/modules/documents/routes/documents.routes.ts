import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { catchAsync } from "../../../utils/catch-async";
import * as controller from "../controllers/documents.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", catchAsync(controller.createDocumentController));
router.get("/", catchAsync(controller.listDocumentsController));
router.get("/:id", catchAsync(controller.getDocumentController));
router.put("/:id", catchAsync(controller.updateDocumentController));
router.delete("/:id", catchAsync(controller.deleteDocumentController));

router.post("/:id/versions", catchAsync(controller.addDocumentVersionController));
router.get("/:id/versions", catchAsync(controller.listDocumentVersionsController));
router.delete("/:id/versions/:versionId", catchAsync(controller.deleteDocumentVersionController));

export { router as documentsRouter };

