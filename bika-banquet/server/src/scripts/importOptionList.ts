import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import type { PrismaClient } from '@prisma/client';
import { buildImportPayload, WorkbookSheetData } from './importOptionList.helpers';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DEFAULT_WORKBOOK_PATH =
  '/Users/harshitgoyal/Library/Group Containers/group.com.apple.coreservices.useractivityd/shared-pasteboard/items/0D8378E1-73DA-4966-9B08-1ED2A61E9330/Option List.xlsx';
const DEFAULT_PYTHON_PATH =
  '/Users/harshitgoyal/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const SHEET_NAMES = ['Item List', 'Item List(2)'];
let prisma: PrismaClient;

interface ScriptOptions {
  execute: boolean;
  clearExisting: boolean;
  filePath: string;
}

function parseArgs(argv: string[]): ScriptOptions {
  const options: ScriptOptions = {
    execute: false,
    clearExisting: false,
    filePath: DEFAULT_WORKBOOK_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--execute') {
      options.execute = true;
      continue;
    }
    if (arg === '--clear-existing') {
      options.clearExisting = true;
      continue;
    }
    if (arg === '--file' && argv[index + 1]) {
      options.filePath = argv[index + 1];
      index += 1;
      continue;
    }
  }

  return options;
}

function resolvePythonPath(): string {
  const configured = process.env.OPTION_LIST_PYTHON || DEFAULT_PYTHON_PATH;
  if (fs.existsSync(configured)) {
    return configured;
  }
  return 'python3';
}

function loadWorkbookSheets(filePath: string): WorkbookSheetData[] {
  const pythonPath = resolvePythonPath();
  const scriptPath = path.resolve(__dirname, 'importOptionListWorkbook.py');
  const raw = execFileSync(pythonPath, [scriptPath, filePath, ...SHEET_NAMES], {
    encoding: 'utf8',
  });

  const parsed = JSON.parse(raw) as { sheets: WorkbookSheetData[] };
  return parsed.sheets;
}

async function assertSafeToClearExistingData(): Promise<void> {
  const bookingMenuItemCount = await prisma.bookingMenuItems.count();
  if (bookingMenuItemCount > 0) {
    throw new Error(
      `Refusing to clear items because booking_menu_items still contains ${bookingMenuItemCount} record(s).`
    );
  }
}

async function clearExistingData(): Promise<void> {
  await assertSafeToClearExistingData();

  const [templateMenuItems, templateMenus, items, itemTypes] = await prisma.$transaction([
    prisma.templateMenuItem.deleteMany(),
    prisma.templateMenu.deleteMany(),
    prisma.item.deleteMany(),
    prisma.itemType.deleteMany(),
  ]);

  console.log(
    JSON.stringify(
      {
        cleared: {
          templateMenuItems: templateMenuItems.count,
          templateMenus: templateMenus.count,
          items: items.count,
          itemTypes: itemTypes.count,
        },
      },
      null,
      2
    )
  );
}

async function executeImport(payload: ReturnType<typeof buildImportPayload>): Promise<{
  itemTypesCreatedOrUpdated: number;
  itemsCreated: number;
  itemsUpdated: number;
}> {
  return prisma.$transaction(async (tx) => {
    for (const itemType of payload.itemTypes) {
      await tx.itemType.upsert({
        where: { name: itemType.name },
        update: {
          order: itemType.order,
          displayOrder: itemType.order,
          isActive: true,
        },
        create: {
          name: itemType.name,
          order: itemType.order,
          displayOrder: itemType.order,
          isActive: true,
        },
      });
    }

    const itemTypes = await tx.itemType.findMany({
      where: {
        name: {
          in: payload.itemTypes.map((itemType) => itemType.name),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const itemTypeIdByKey = new Map(
      itemTypes.map((itemType) => [itemType.name.trim().toLowerCase(), itemType.id])
    );

    const existingItems = await tx.item.findMany({
      where: {
        itemTypeId: {
          in: itemTypes.map((itemType) => itemType.id),
        },
      },
      select: {
        id: true,
        itemTypeId: true,
        name: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const existingItemByCompositeKey = new Map<string, { id: string; itemTypeId: string }>();
    for (const item of existingItems) {
      const key = `${item.itemTypeId}::${item.name.trim().toLowerCase()}`;
      if (!existingItemByCompositeKey.has(key)) {
        existingItemByCompositeKey.set(key, { id: item.id, itemTypeId: item.itemTypeId });
      }
    }

    let itemsCreated = 0;
    let itemsUpdated = 0;

    for (const item of payload.items) {
      const itemTypeId = itemTypeIdByKey.get(item.itemTypeKey);
      if (!itemTypeId) {
        throw new Error(`Missing item type mapping for ${item.itemTypeKey}`);
      }

      const compositeKey = `${itemTypeId}::${item.name.trim().toLowerCase()}`;
      const existingItem = existingItemByCompositeKey.get(compositeKey);

      if (existingItem) {
        await tx.item.update({
          where: { id: existingItem.id },
          data: {
            name: item.name,
            point: item.points,
            points: item.points,
            isVeg: true,
            isActive: true,
          },
        });
        itemsUpdated += 1;
        continue;
      }

      const created = await tx.item.create({
        data: {
          itemTypeId,
          name: item.name,
          point: item.points,
          points: item.points,
          isVeg: true,
          isActive: true,
        },
        select: {
          id: true,
        },
      });
      existingItemByCompositeKey.set(compositeKey, { id: created.id, itemTypeId });
      itemsCreated += 1;
    }

    return {
      itemTypesCreatedOrUpdated: payload.itemTypes.length,
      itemsCreated,
      itemsUpdated,
    };
  });
}

async function printSummary(payload: ReturnType<typeof buildImportPayload>): Promise<void> {
  console.log(
    JSON.stringify(
      {
        itemTypeCount: payload.itemTypes.length,
        itemCount: payload.items.length,
        itemTypes: payload.itemTypes,
        sampleItems: payload.items.slice(0, 20),
      },
      null,
      2
    )
  );
}

async function main(): Promise<void> {
  ({ default: prisma } = await import('../config/database'));

  const options = parseArgs(process.argv.slice(2));
  const workbookSheets = loadWorkbookSheets(options.filePath);
  const payload = buildImportPayload(workbookSheets);

  await printSummary(payload);

  if (!options.execute) {
    console.log('Dry run only. Re-run with --execute to write to the database.');
    return;
  }

  if (options.clearExisting) {
    await clearExistingData();
  }

  const importStats = await executeImport(payload);

  const [itemTypeCount, itemCount] = await Promise.all([
    prisma.itemType.count(),
    prisma.item.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        imported: {
          itemTypes: itemTypeCount,
          items: itemCount,
        },
        sync: importStats,
      },
      null,
      2
    )
  );
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
