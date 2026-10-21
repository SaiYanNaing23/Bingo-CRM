"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const express_2 = require("uploadthing/express");
const env_1 = require("../config/env");
const auth_routes_1 = require("../modules/auth/routes/auth.routes");
const companies_routes_1 = require("../modules/companies/routes/companies.routes");
const health_routes_1 = require("../modules/health/health.routes");
const contacts_routes_1 = require("../modules/contacts/routes/contacts.routes");
const applications_routes_1 = require("../modules/applications/routes/applications.routes");
const tasks_routes_1 = require("../modules/tasks/routes/tasks.routes");
const projects_routes_1 = require("../modules/projects/routes/projects.routes");
const notes_routes_1 = require("../modules/notes/routes/notes.routes");
const calendar_routes_1 = require("../modules/calendar/routes/calendar.routes");
const documents_routes_1 = require("../modules/documents/routes/documents.routes");
const uploadthing_1 = require("../modules/documents/services/uploadthing");
exports.apiRouter = (0, express_1.Router)();
exports.apiRouter.use(health_routes_1.healthRouter);
exports.apiRouter.use("/auth", auth_routes_1.authRouter);
exports.apiRouter.use("/companies", companies_routes_1.companiesRouter);
exports.apiRouter.use("/contacts", contacts_routes_1.contactsRouter);
exports.apiRouter.use("/applications", applications_routes_1.applicationsRouter);
exports.apiRouter.use("/tasks", tasks_routes_1.tasksRouter);
exports.apiRouter.use("/projects", projects_routes_1.projectsRouter);
exports.apiRouter.use("/notes", notes_routes_1.notesRouter);
exports.apiRouter.use("/calendar", calendar_routes_1.calendarRouter);
exports.apiRouter.use("/documents", documents_routes_1.documentsRouter);
const uploadConfig = env_1.env.UPLOADTHING_TOKEN ? { token: env_1.env.UPLOADTHING_TOKEN } : undefined;
exports.apiRouter.use("/uploadthing", (0, express_2.createRouteHandler)({
    router: uploadthing_1.uploadRouter,
    ...(uploadConfig ? { config: uploadConfig } : {}),
}));
//# sourceMappingURL=index.js.map