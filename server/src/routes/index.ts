import { Router } from "express";
import { createRouteHandler } from "uploadthing/express";

import { env } from "../config/env";
import { authRouter } from "../modules/auth/routes/auth.routes";
import { companiesRouter } from "../modules/companies/routes/companies.routes";
import { healthRouter } from "../modules/health/health.routes";
import { contactsRouter } from "../modules/contacts/routes/contacts.routes";
import { applicationsRouter } from "../modules/applications/routes/applications.routes";
import { tasksRouter } from "../modules/tasks/routes/tasks.routes";
import { projectsRouter } from "../modules/projects/routes/projects.routes";
import { notesRouter } from "../modules/notes/routes/notes.routes";
import { calendarRouter } from "../modules/calendar/routes/calendar.routes";
import { documentsRouter } from "../modules/documents/routes/documents.routes";
import { uploadRouter } from "../modules/documents/services/uploadthing";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/companies", companiesRouter);
apiRouter.use("/contacts", contactsRouter);
apiRouter.use("/applications", applicationsRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/notes", notesRouter);
apiRouter.use("/calendar", calendarRouter);
apiRouter.use("/documents", documentsRouter);

const uploadConfig = env.UPLOADTHING_TOKEN ? { token: env.UPLOADTHING_TOKEN } : undefined;
apiRouter.use(
  "/uploadthing",
  createRouteHandler({
    router: uploadRouter,
    ...(uploadConfig ? { config: uploadConfig } : {}),
  })
);
