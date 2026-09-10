import { Router } from "express";

import { authRouter } from "../modules/auth/routes/auth.routes";
import { companiesRouter } from "../modules/companies/routes/companies.routes";
import { healthRouter } from "../modules/health/health.routes";
import { contactsRouter } from "../modules/contacts/routes/contacts.routes";
import { applicationsRouter } from "../modules/applications/routes/applications.routes";
import { tasksRouter } from "../modules/tasks/routes/tasks.routes";
import { projectsRouter } from "../modules/projects/routes/projects.routes";
import { notesRouter } from "../modules/notes/routes/notes.routes";
import { calendarRouter } from "../modules/calendar/routes/calendar.routes";

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
