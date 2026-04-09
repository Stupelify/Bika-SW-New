const DEFAULT_MAX_LIMIT = 5000;

function getConfiguredMaxLimit(fallback: number): number {
  const raw = process.env.PAGINATION_MAX_LIMIT;
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

export function parsePagination(
  pageRaw: unknown,
  limitRaw: unknown,
  defaultLimit = 20,
  maxLimit = 200
): { page: number; limit: number; skip: number } {
  const effectiveMaxLimit = Math.max(maxLimit, getConfiguredMaxLimit(DEFAULT_MAX_LIMIT));
  const parsedPage = Number.parseInt(String(pageRaw ?? ''), 10);
  const parsedLimit = Number.parseInt(String(limitRaw ?? ''), 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : defaultLimit;
  if (!Number.isFinite(limit) || limit <= 0) {
    limit = defaultLimit;
  }
  if (limit > effectiveMaxLimit) {
    limit = effectiveMaxLimit;
  }

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
