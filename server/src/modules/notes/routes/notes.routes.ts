import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { catchAsync } from "../../../utils/catch-async";
import * as controller from "../controllers/notes.controller";

const router = Router();
router.use(authMiddleware);
router.post("/", catchAsync(controller.createNoteController));
router.get("/", catchAsync(controller.listNotesController));
router.get("/:id", catchAsync(controller.getNoteController));
router.put("/:id", catchAsync(controller.updateNoteController));
router.delete("/:id", catchAsync(controller.deleteNoteController));

export { router as notesRouter };
