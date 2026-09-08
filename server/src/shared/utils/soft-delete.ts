export const withActiveRecordFilter = <TWhere extends Record<string, unknown>>(
  where: TWhere
) => {
  return {
    ...where,
    deletedAt: null,
  } satisfies TWhere & { deletedAt: null };
};
