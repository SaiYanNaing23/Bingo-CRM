export type ContactRole = string;
export type Contact = {
    id: string;
    userId: string;
    companyId: string;
    photo: string;
    name: string;
    email: string;
    phone: string;
    linkedIn: string;
    role: ContactRole;
    notes: string | null;
    lastContactAt: Date;
    nextFollowUpAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};
export type ContactListSort = "name" | "lastContactAt" | "createdAt" | "updatedAt";
export type ContactListOrder = "asc" | "desc";
//# sourceMappingURL=contacts.types.d.ts.map