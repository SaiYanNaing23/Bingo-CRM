import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { catchAsync } from "../../../utils/catch-async";
import * as controller from "../controllers/calendar.controller";

const router = Router();
router.use(authMiddleware);
router.post("/events", catchAsync(controller.createCalendarEventController));
router.get("/events", catchAsync(controller.listCalendarEventsController));
router.get("/events/:id", catchAsync(controller.getCalendarEventController));
router.put("/events/:id", catchAsync(controller.updateCalendarEventController));
router.delete("/events/:id", catchAsync(controller.deleteCalendarEventController));
router.get("/range", catchAsync(controller.getCalendarRangeController));
router.get("/reminders", catchAsync(controller.listCalendarRemindersController));
export { router as calendarRouter };
