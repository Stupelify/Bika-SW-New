import { z } from 'zod';

/**
 * A small denylist of well-known weak passwords. Not exhaustive — just enough
 * to block the most obvious choices (including this app's old default).
 */
const COMMON_PASSWORDS = new Set([
  'password',
  '12345678',
  'admin123',
  'password1',
  'qwerty123',
  '11111111',
  'iloveyou',
  'changeme',
]);

/**
 * Shared strong-password rule for all admin-set passwords (create user,
 * reset password). Minimum 8 characters, must mix letters and numbers, and
 * must not be a well-known weak password.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), {
    message: 'Password must include both letters and numbers',
  })
  .refine((v) => !COMMON_PASSWORDS.has(v.toLowerCase()), {
    message: 'Password is too common; choose a stronger one',
  });
