export declare const validateCreateApplication: (input: unknown) => {
    timezone: string;
    stage: "HR" | "ARCHIVED" | "WISHLIST" | "APPLIED" | "TECHNICAL" | "ASSIGNMENT" | "FINAL" | "OFFER" | "REJECTED";
    companyId: string;
    position: string;
    dateApplied?: Date | null | undefined;
    salary?: string | null | undefined;
    recruiter?: string | null | undefined;
    notes?: string | null | undefined;
};
export declare const validateUpdateApplication: (input: unknown) => {
    companyId?: string | undefined;
    position?: string | undefined;
    dateApplied?: Date | null | undefined;
    salary?: string | null | undefined;
    timezone?: string | undefined;
    recruiter?: string | null | undefined;
    notes?: string | null | undefined;
};
export declare const validateApplicationId: (input: unknown) => string;
export declare const validateApplicationListQuery: (input: unknown) => {
    sortBy: "createdAt" | "updatedAt" | "dateApplied" | "position";
    order: "asc" | "desc";
    page?: number | undefined;
    limit?: number | undefined;
    companyId?: string | undefined;
    stage?: "HR" | "ARCHIVED" | "WISHLIST" | "APPLIED" | "TECHNICAL" | "ASSIGNMENT" | "FINAL" | "OFFER" | "REJECTED" | undefined;
    dateAppliedFrom?: Date | undefined;
    dateAppliedTo?: Date | undefined;
    search?: string | undefined;
};
export declare const validateApplicationHistoryQuery: (input: unknown) => {
    page?: number | undefined;
    limit?: number | undefined;
};
export declare const validateApplicationStageUpdate: (input: unknown) => {
    stage: "HR" | "ARCHIVED" | "WISHLIST" | "APPLIED" | "TECHNICAL" | "ASSIGNMENT" | "FINAL" | "OFFER" | "REJECTED";
};
//# sourceMappingURL=applications.validators.d.ts.map