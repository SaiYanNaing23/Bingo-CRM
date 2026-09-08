// Zod optional fields may include undefined; Prisma expects omitted properties.
export const omitUndefined = <T extends object>(input: T): {
  [K in keyof T]: Exclude<T[K], undefined>;
} => {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as { [K in keyof T]: Exclude<T[K], undefined> };
};
