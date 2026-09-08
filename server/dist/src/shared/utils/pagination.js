"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPaginationMeta = exports.parsePaginationQuery = void 0;
const env_1 = require("../../config/env");
const toSingleValue = (value) => {
    if (typeof value === "string") {
        return value;
    }
    if (Array.isArray(value)) {
        return value[0];
    }
    return undefined;
};
const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(toSingleValue(value) ?? "", 10);
    return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};
const parsePaginationQuery = (query) => {
    const page = parsePositiveInt(query.page, 1);
    const requestedLimit = parsePositiveInt(query.limit, env_1.env.PAGINATION_DEFAULT_LIMIT);
    return {
        page,
        limit: Math.min(requestedLimit, env_1.env.PAGINATION_MAX_LIMIT),
    };
};
exports.parsePaginationQuery = parsePaginationQuery;
const toPaginationMeta = (total, page, limit) => {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
};
exports.toPaginationMeta = toPaginationMeta;
//# sourceMappingURL=pagination.js.map