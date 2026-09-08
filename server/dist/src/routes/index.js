"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_routes_1 = require("../modules/auth/routes/auth.routes");
const companies_routes_1 = require("../modules/companies/routes/companies.routes");
const health_routes_1 = require("../modules/health/health.routes");
const contacts_routes_1 = require("../modules/contacts/routes/contacts.routes");
const applications_routes_1 = require("../modules/applications/routes/applications.routes");
const tasks_routes_1 = require("../modules/tasks/routes/tasks.routes");
exports.apiRouter = (0, express_1.Router)();
exports.apiRouter.use(health_routes_1.healthRouter);
exports.apiRouter.use("/auth", auth_routes_1.authRouter);
exports.apiRouter.use("/companies", companies_routes_1.companiesRouter);
exports.apiRouter.use("/contacts", contacts_routes_1.contactsRouter);
exports.apiRouter.use("/applications", applications_routes_1.applicationsRouter);
exports.apiRouter.use("/tasks", tasks_routes_1.tasksRouter);
//# sourceMappingURL=index.js.map