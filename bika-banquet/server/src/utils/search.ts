export function sanitizeSearchTerm(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Escape SQL LIKE wildcards to avoid unintended broad matches.
  const escaped = trimmed.replace(/[%_]/g, '\\$&');
  return escaped.slice(0, 200);
}
