"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withActiveRecordFilter = void 0;
const withActiveRecordFilter = (where) => {
    return {
        ...where,
        deletedAt: null,
    };
};
exports.withActiveRecordFilter = withActiveRecordFilter;
//# sourceMappingURL=soft-delete.js.map