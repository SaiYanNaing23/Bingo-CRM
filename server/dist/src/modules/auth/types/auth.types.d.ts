export type UserRole = "ADMIN" | "USER";
export type PublicUser = {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
};
export type AuthTokenPayload = {
    user: PublicUser;
    token: string;
};
//# sourceMappingURL=auth.types.d.ts.map