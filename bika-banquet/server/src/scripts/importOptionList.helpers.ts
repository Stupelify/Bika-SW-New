import { toEntryCase } from '../utils/textCase';

export type SheetCell = string | number | boolean | null | undefined;

export interface WorkbookSheetData {
  name: string;
  rows: SheetCell[][];
}

export interface ImportItemTypeRecord {
  key: string;
  name: string;
  order: number;
}

export interface ImportItemRecord {
  itemTypeKey: string;
  name: string;
  points: number;
}

export interface ImportPayload {
  itemTypes: ImportItemTypeRecord[];
  items: ImportItemRecord[];
}

const IGNORED_ITEM_TYPE_KEYS = new Set(['fruits counter']);
const SPECIAL_COUNTER_TYPES = [
  { match: /\bpasta\b/i, itemTypeName: 'Pasta' },
  { match: /\bmongolian\b/i, itemTypeName: 'Mongolian' },
  { match: /\bsizzler\b/i, itemTypeName: 'Sizzler' },
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeDisplayName(value: string): string {
  const compact = normalizeWhitespace(value)
    .replace(/\s+([/),])/g, '$1')
    .replace(/([(])\s+/g, '$1');

  return toEntryCase(compact);
}

function toKey(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

function parseText(cell: SheetCell): string | null {
  if (typeof cell !== 'string') return null;
  const compact = normalizeWhitespace(cell);
  return compact ? compact : null;
}

function parsePoints(cell: SheetCell): number | null {
  if (typeof cell === 'number' && Number.isFinite(cell)) {
    return cell;
  }
  if (typeof cell === 'string') {
    const compact = cell.trim();
    if (!compact) return null;
    const parsed = Number(compact);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getMaxColumns(rows: SheetCell[][]): number {
  return rows.reduce((max, row) => Math.max(max, row.length), 0);
}

function hasUnbalancedOpenParenthesis(value: string): boolean {
  const opens = (value.match(/\(/g) || []).length;
  const closes = (value.match(/\)/g) || []).length;
  return opens > closes;
}

function shouldMergeWithNextRow(
  currentName: string,
  currentPoints: number,
  nextName: string | null,
  nextPoints: number | null
): boolean {
  if (!nextName || nextPoints === null || nextPoints !== currentPoints) {
    return false;
  }

  return /[/\-]$/.test(currentName) || hasUnbalancedOpenParenthesis(currentName);
}

function resolveSpecialCounterItemType(name: string): string | null {
  for (const candidate of SPECIAL_COUNTER_TYPES) {
    if (candidate.match.test(name)) {
      return candidate.itemTypeName;
    }
  }
  return null;
}

function isLikelyHeader(name: string): boolean {
  const lettersOnly = name.replace(/[^A-Za-z]/g, '');
  if (!lettersOnly) return false;
  return lettersOnly === lettersOnly.toUpperCase();
}

export function buildImportPayload(sheets: WorkbookSheetData[]): ImportPayload {
  const items: ImportItemRecord[] = [];
  const itemTypesByKey = new Map<string, { name: string; firstPosition: number }>();
  const seenItems = new Set<string>();

  const ensureItemType = (name: string, position: number): string => {
    const key = toKey(name);
    const existing = itemTypesByKey.get(key);
    if (!existing) {
      itemTypesByKey.set(key, { name, firstPosition: position });
    } else if (position < existing.firstPosition) {
      existing.firstPosition = position;
    }
    return key;
  };

  sheets.forEach((sheet, sheetIndex) => {
    const maxColumns = getMaxColumns(sheet.rows);

    for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 2) {
      let currentItemTypeKey: string | null = null;
      let currentSectionState: 'none' | 'active' | 'ignored' = 'none';

      for (let rowIndex = 0; rowIndex < sheet.rows.length; rowIndex += 1) {
        const row = sheet.rows[rowIndex] || [];
        const rawName = parseText(row[columnIndex]);
        const rawPoints = parsePoints(row[columnIndex + 1]);
        const position = sheetIndex * 1_000_000 + rowIndex * 100 + columnIndex;

        if (!rawName && rawPoints === null) {
          continue;
        }

        if (rawName && rawPoints === null && isLikelyHeader(rawName)) {
          const itemTypeName = normalizeDisplayName(rawName);
          const itemTypeKey = toKey(itemTypeName);
          if (IGNORED_ITEM_TYPE_KEYS.has(itemTypeKey)) {
            currentItemTypeKey = null;
            currentSectionState = 'ignored';
          } else {
            currentItemTypeKey = ensureItemType(itemTypeName, position);
            currentSectionState = 'active';
          }
          continue;
        }

        if (!rawName || rawPoints === null || !currentItemTypeKey || currentSectionState !== 'active') {
          continue;
        }

        let mergedName = rawName;
        let consumedRows = 0;

        while (true) {
          const nextRow = sheet.rows[rowIndex + consumedRows + 1] || [];
          const nextName = parseText(nextRow[columnIndex]);
          const nextPoints = parsePoints(nextRow[columnIndex + 1]);

          if (!shouldMergeWithNextRow(mergedName, rawPoints, nextName, nextPoints)) {
            break;
          }

          mergedName = /[/\-]$/.test(mergedName)
            ? `${mergedName}${nextName}`
            : `${mergedName} ${nextName}`;
          consumedRows += 1;
        }

        rowIndex += consumedRows;

        const specialItemTypeName = resolveSpecialCounterItemType(mergedName);
        const itemTypeKey = specialItemTypeName
          ? ensureItemType(specialItemTypeName, position)
          : currentItemTypeKey;
        const itemName = specialItemTypeName
          ? `Live ${specialItemTypeName} Counter`
          : normalizeDisplayName(mergedName);
        const dedupeKey = `${itemTypeKey}::${toKey(itemName)}`;

        if (seenItems.has(dedupeKey)) {
          continue;
        }

        seenItems.add(dedupeKey);
        items.push({
          itemTypeKey,
          name: itemName,
          points: rawPoints,
        });
      }
    }
  });

  const itemTypes = Array.from(itemTypesByKey.entries())
    .sort((left, right) => left[1].firstPosition - right[1].firstPosition)
    .map(([key, value], index) => ({
      key,
      name: value.name,
      order: (index + 1) * 10,
    }));

  return { itemTypes, items };
}
