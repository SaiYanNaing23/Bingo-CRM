export type CompanyStatus = "ACTIVE" | "ARCHIVED";
export type Company = {
    id: string;
    userId: string;
    logo: string | null;
    name: string;
    country: string | null;
    industry: string | null;
    website: string | null;
    linkedIn: string | null;
    careerPage: string | null;
    techStack: string[];
    size: number | null;
    salaryRange: string | null;
    remote: boolean;
    notes: string | null;
    status: CompanyStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};
export type CompanyListSort = "name" | "createdAt" | "updatedAt";
export type CompanyListOrder = "asc" | "desc";
export type CompanyTransitionInput = {
    status: CompanyStatus;
};
//# sourceMappingURL=companies.types.d.ts.map