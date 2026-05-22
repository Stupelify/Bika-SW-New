export const QUANTITY_UNITS = [
  'kg',
  'g',
  'liter',
  'ml',
  'piece',
  'packet',
  'dozen',
  'box',
] as const;

export type QuantityUnit = (typeof QUANTITY_UNITS)[number];

export type UnitCategory = 'weight' | 'volume' | 'count';

const UNIT_META: Record<QuantityUnit, { category: UnitCategory; factorToBase: number }> = {
  kg: { category: 'weight', factorToBase: 1000 },
  g: { category: 'weight', factorToBase: 1 },
  liter: { category: 'volume', factorToBase: 1000 },
  ml: { category: 'volume', factorToBase: 1 },
  piece: { category: 'count', factorToBase: 1 },
  packet: { category: 'count', factorToBase: 1 },
  dozen: { category: 'count', factorToBase: 12 },
  box: { category: 'count', factorToBase: 1 },
};

export function isQuantityUnit(value: unknown): value is QuantityUnit {
  return typeof value === 'string' && (QUANTITY_UNITS as readonly string[]).includes(value.trim().toLowerCase());
}

export function normalizeQuantityUnit(value: unknown): QuantityUnit | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!isQuantityUnit(normalized)) return null;
  return normalized as QuantityUnit;
}

export function getUnitCategory(unit: QuantityUnit): UnitCategory {
  return UNIT_META[unit].category;
}

export function areUnitsCompatible(from: QuantityUnit, to: QuantityUnit): boolean {
  return getUnitCategory(from) === getUnitCategory(to);
}

