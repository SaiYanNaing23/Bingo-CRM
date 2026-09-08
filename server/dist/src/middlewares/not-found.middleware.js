"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const response_1 = require("../shared/utils/response");
const notFoundHandler = (req, res) => {
    (0, response_1.sendError)(res, "Not Found", 404, { path: req.originalUrl }, "NOT_FOUND");
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=not-found.middleware.js.map