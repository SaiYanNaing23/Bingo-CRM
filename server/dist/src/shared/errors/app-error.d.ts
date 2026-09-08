declare class AppError extends Error {
    readonly statusCode: number;
    readonly details: unknown;
    readonly code: string;
    constructor(message: string, statusCode?: number, details?: unknown, code?: string);
}
export { AppError };
//# sourceMappingURL=app-error.d.ts.map