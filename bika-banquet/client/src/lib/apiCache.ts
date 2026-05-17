const RELATED_CACHE_SEGMENTS: Record<string, string[]> = {
  'item-types': ['items'],
};

export function getCacheSegmentsToInvalidate(url: string | undefined): string[] {
  const segment = (url ?? '').split('/')[1] ?? '';
  if (!segment) return [];

  return [segment, ...(RELATED_CACHE_SEGMENTS[segment] ?? [])].filter(
    (value, index, array) => array.indexOf(value) === index
  );
}

export function invalidateCacheEntries(
  cache: Map<string, { data: unknown; exp: number }>,
  url: string | undefined
): void {
  const segments = getCacheSegmentsToInvalidate(url);
  if (segments.length === 0) return;

  Array.from(cache.keys()).forEach((key) => {
    if (segments.some((segment) => key.includes(`/${segment}`))) {
      cache.delete(key);
    }
  });
}
