const SEPARATOR_PATTERN = /(^|[\s\-_/()&+,'".:;])([a-z])/g;

export function toEntryCase(input: string): string {
  const compact = input.trim().replace(/\s+/g, ' ');
  if (!compact) return '';

  return compact
    .toLowerCase()
    .replace(SEPARATOR_PATTERN, (_match, separator: string, char: string) => {
      return `${separator}${char.toUpperCase()}`;
    });
}

export function normalizeCaseFields<T extends Record<string, unknown>>(
  payload: T,
  fields: Array<keyof T>
): T {
  const normalized = { ...payload };
  fields.forEach((field) => {
    const value = normalized[field];
    if (typeof value === 'string') {
      normalized[field] = toEntryCase(value) as T[keyof T];
    }
  });
  return normalized;
}

export function normalizeCaseInArrayObjects<T extends Record<string, unknown>>(
  rows: T[] | undefined,
  fields: Array<keyof T>
): T[] | undefined {
  if (!Array.isArray(rows)) {
    return rows;
  }
  return rows.map((row) => normalizeCaseFields(row, fields));
}
