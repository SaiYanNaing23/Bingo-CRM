"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omitUndefined = void 0;
// Zod optional fields may include undefined; Prisma expects omitted properties.
const omitUndefined = (input) => {
    return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
};
exports.omitUndefined = omitUndefined;
//# sourceMappingURL=omit-undefined.js.map