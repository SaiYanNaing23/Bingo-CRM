"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectActivitySelect = exports.projectSelect = void 0;
exports.projectSelect = {
    id: true, userId: true, name: true, githubUrl: true, liveDemoUrl: true, status: true,
    progress: true, stack: true, screenshots: true, lessonsLearned: true,
    createdAt: true, updatedAt: true, deletedAt: true,
};
exports.projectActivitySelect = {
    id: true, projectId: true, createdById: true, type: true, fromStatus: true, toStatus: true,
    fromProgress: true, toProgress: true, content: true, createdAt: true,
};
//# sourceMappingURL=projects.types.js.map