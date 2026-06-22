/**
 * urlListState.ts
 *
 * Small helper shared by the list screens to keep filter/search/sort state in
 * the URL query string (so a reload restores the view and filtered links are
 * shareable). Kept free of React/Next so it is trivially unit-testable.
 *
 * `buildListUrl` removes the keys a screen owns, re-applies the provided
 * non-empty entries, and preserves any foreign params already on the URL
 * (e.g. `?new=1` quick-create deep-links), returning a path+query string for
 * `router.replace`.
 */
export function buildListUrl(
  pathname: string,
  currentSearch: string,
  ownedKeys: string[],
  entries: Record<string, string | undefined>
): string {
  const params = new URLSearchParams(currentSearch);
  for (const key of ownedKeys) params.delete(key);
  for (const [key, value] of Object.entries(entries)) {
    const trimmed = (value ?? '').trim();
    if (trimmed) params.set(key, trimmed);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
