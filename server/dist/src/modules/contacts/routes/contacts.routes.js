"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactsRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const catch_async_1 = require("../../../utils/catch-async");
const contacts_controller_1 = require("../controllers/contacts.controller");
const router = (0, express_1.Router)();
exports.contactsRouter = router;
router.post("/", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(contacts_controller_1.createContactController));
router.get("/", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(contacts_controller_1.listContactsController));
router.get("/:id", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(contacts_controller_1.getContactController));
router.put("/:id", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(contacts_controller_1.updateContactController));
router.delete("/:id", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(contacts_controller_1.deleteContactController));
router.patch("/:id/follow-up", auth_middleware_1.authMiddleware, (0, catch_async_1.catchAsync)(contacts_controller_1.updateContactFollowUpController));
//# sourceMappingURL=contacts.routes.js.map