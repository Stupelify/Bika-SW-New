export function parsePagination(
  pageRaw: unknown,
  limitRaw: unknown,
  defaultLimit = 20,
  maxLimit = 200
): { page: number; limit: number; skip: number } {
  const parsedPage = Number.parseInt(String(pageRaw ?? ''), 10);
  const parsedLimit = Number.parseInt(String(limitRaw ?? ''), 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : defaultLimit;
  if (!Number.isFinite(limit) || limit <= 0) {
    limit = defaultLimit;
  }
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
