"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCalendarRemindersController = exports.getCalendarRangeController = exports.deleteCalendarEventController = exports.updateCalendarEventController = exports.getCalendarEventController = exports.listCalendarEventsController = exports.createCalendarEventController = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const response_1 = require("../../../shared/utils/response");
const service = __importStar(require("../services/calendar.service"));
const validate = __importStar(require("../validators/calendar.validators"));
const userId = (req) => {
    if (!req.user)
        throw new app_error_1.AppError("Authentication required", 401, undefined, "AUTH_MISSING_TOKEN");
    return req.user.id;
};
const eventId = (req) => validate.validateCalendarEventId(req.params.id);
const createCalendarEventController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.createCalendarEvent(validate.validateCreateCalendarEvent(req.body), userId(req)), 201);
};
exports.createCalendarEventController = createCalendarEventController;
const listCalendarEventsController = async (req, res) => {
    const result = await service.listCalendarEvents(validate.validateCalendarEventList(req.query), userId(req));
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listCalendarEventsController = listCalendarEventsController;
const getCalendarEventController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.getCalendarEvent(eventId(req), userId(req)));
};
exports.getCalendarEventController = getCalendarEventController;
const updateCalendarEventController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.updateCalendarEvent(eventId(req), validate.validateUpdateCalendarEvent(req.body), userId(req)));
};
exports.updateCalendarEventController = updateCalendarEventController;
const deleteCalendarEventController = async (req, res) => {
    const id = eventId(req);
    await service.deleteCalendarEvent(id, userId(req));
    (0, response_1.sendSuccess)(res, { id, deleted: true });
};
exports.deleteCalendarEventController = deleteCalendarEventController;
const getCalendarRangeController = async (req, res) => {
    (0, response_1.sendSuccess)(res, await service.getCalendarRange(validate.validateCalendarRange(req.query), userId(req)));
};
exports.getCalendarRangeController = getCalendarRangeController;
const listCalendarRemindersController = async (req, res) => {
    const result = await service.listCalendarReminders(validate.validateCalendarReminders(req.query), userId(req));
    (0, response_1.sendPaginated)(res, result.data, result.meta);
};
exports.listCalendarRemindersController = listCalendarRemindersController;
//# sourceMappingURL=calendar.controller.js.map