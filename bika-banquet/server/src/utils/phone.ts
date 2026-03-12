const DIGITS_ONLY = /\D+/g;

export function normalizeDigitsPhone(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(DIGITS_ONLY, '').trim();
  return normalized || undefined;
}

export function normalizeCountryCode(value: unknown, fallback = '+91'): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const normalized = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  return /^\+\d{1,4}$/.test(normalized) ? normalized : fallback;
}

export function toE164(countryCode: unknown, phone: unknown): string | undefined {
  const digits = normalizeDigitsPhone(phone);
  if (!digits) return undefined;
  const code = normalizeCountryCode(countryCode);
  return `${code}${digits}`;
}
