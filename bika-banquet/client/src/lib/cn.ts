import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose class names with conflict-aware Tailwind merging. Use this instead of
 * raw string concatenation so later utility classes reliably win over earlier
 * ones (e.g. `cn('px-4', condition && 'px-2')` yields `px-2`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
