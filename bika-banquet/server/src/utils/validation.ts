import { z } from 'zod';

// Support legacy imported IDs (numeric/string) alongside UUID-style IDs.
const LEGACY_OR_UUID_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

export function idSchema(label: string) {
  return z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z
      .string()
      .min(1, `${label} is required`)
      .regex(LEGACY_OR_UUID_ID_PATTERN, `Invalid ${label}`)
  );
}
