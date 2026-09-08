"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stageHistorySelect = exports.applicationSelect = void 0;
exports.applicationSelect = {
    id: true, userId: true, companyId: true, position: true,
    dateApplied: true, salary: true, timezone: true, recruiter: true,
    stage: true, notes: true, createdAt: true, updatedAt: true, deletedAt: true,
};
exports.stageHistorySelect = {
    id: true, applicationId: true, fromStage: true, toStage: true,
    changedById: true, createdAt: true,
};
//# sourceMappingURL=applications.types.js.map