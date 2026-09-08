import { Router } from "express";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { catchAsync } from "../../../utils/catch-async";
import {
  createContactController,
  deleteContactController,
  getContactController,
  listContactsController,
  updateContactController,
  updateContactFollowUpController,
} from "../controllers/contacts.controller";

const router = Router();

router.post("/", authMiddleware, catchAsync(createContactController));
router.get("/", authMiddleware, catchAsync(listContactsController));
router.get("/:id", authMiddleware, catchAsync(getContactController));
router.put("/:id", authMiddleware, catchAsync(updateContactController));
router.delete("/:id", authMiddleware, catchAsync(deleteContactController));
router.patch("/:id/follow-up", authMiddleware, catchAsync(updateContactFollowUpController));

export { router as contactsRouter };
