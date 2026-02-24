import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import prisma from '../config/database';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { normalizeCaseFields, normalizeCaseInArrayObjects } from '../utils/textCase';
import { idSchema } from '../utils/validation';
import {
  cancelBookingEventInGoogleCalendar,
  syncBookingEventToGoogleCalendar,
} from '../services/googleCalendar.service';

// Validation schemas
export const createBookingSchema = z.object({
  body: z.object({
    customerId: idSchema('customer ID'),
    secondCustomerId: idSchema('second customer ID').optional(),
    referredById: idSchema('referred by customer ID').optional(),
    functionName: z.string().min(2, 'Function name is required'),
    functionType: z.string().min(2, 'Function type is required'),
    functionDate: z.string(),
    functionTime: z.string(),
    expectedGuests: z.number().min(1, 'Expected guests must be at least 1'),
    confirmedGuests: z.number().optional(),
    isQuotation: z.boolean().optional(),
    halls: z.array(z.object({
      hallId: idSchema('hall ID'),
      charges: z.number().min(0),
    })).optional(),
    packs: z.array(z.object({
      mealSlotId: idSchema('meal slot ID').optional(),
      packName: z.string(),
      noOfPack: z.number().min(1).optional(),
      packCount: z.number().min(1).optional(),
      hallIds: z.array(z.number().int()).optional(),
      ratePerPlate: z.number().min(0),
      setupCost: z.number().min(0).optional(),
      extraCharges: z.number().min(0).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      extraPlate: z.number().int().optional(),
      extraRate: z.string().optional(),
      extraAmount: z.string().optional(),
      menuPoint: z.number().int().optional(),
      hallRate: z.string().optional(),
      boardToRead: z.string().optional(),
      hallName: z.string().optional(),
      timeSlot: z.string().optional(),
      tags: z.array(z.string()).optional(),
      menu: z.object({
        name: z.string(),
        templateMenuId: idSchema('template menu ID').optional(),
        items: z.array(z.object({
          itemId: idSchema('item ID'),
          quantity: z.number().min(1),
        })),
      }),
    })).optional(),
    additionalItems: z.array(z.object({
      description: z.string(),
      charges: z.number(),
      quantity: z.number().min(1).optional(),
    })).optional(),
    discountAmount: z.number().min(0).optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
  }),
});

function toSafeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

type BookingHallInputRow = {
  hallId: string;
  charges: number;
};

function normalizeBookingHallRows(value: unknown): BookingHallInputRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const rows = new Map<string, BookingHallInputRow>();
  value.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const hallIdRaw = (entry as { hallId?: unknown }).hallId;
    const hallId = typeof hallIdRaw === 'string' ? hallIdRaw.trim() : '';
    if (!hallId) {
      return;
    }

    const charges = toSafeNumber((entry as { charges?: unknown }).charges);
    const current = rows.get(hallId);
    if (!current) {
      rows.set(hallId, { hallId, charges });
      return;
    }

    // Keep the maximum charge for duplicate hall selections in payload.
    rows.set(hallId, { hallId, charges: Math.max(current.charges, charges) });
  });

  return Array.from(rows.values());
}

async function assertSingleBanquetHallSelection(
  tx: Prisma.TransactionClient,
  hallRows: BookingHallInputRow[]
): Promise<void> {
  if (hallRows.length === 0) {
    return;
  }

  const hallIds = hallRows.map((row) => row.hallId);
  const halls = await tx.hall.findMany({
    where: {
      id: {
        in: hallIds,
      },
    },
    select: {
      id: true,
      banquetId: true,
    },
  });

  if (halls.length !== hallIds.length) {
    throw new Error('One or more selected halls are invalid');
  }

  const banquetIds = new Set(halls.map((hall) => hall.banquetId));
  if (banquetIds.size > 1) {
    throw new Error('Selected halls must belong to the same banquet');
  }
}

const MENU_BACKGROUND_IMAGE_URL =
  process.env.MENU_PDF_BACKGROUND_URL ||
  'https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/849w-_8bavztmyj0-removebg-X63LAPdJAg940IXG.png';
const MENU_LOGO_IMAGE_URL =
  process.env.MENU_PDF_LOGO_URL ||
  'https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/1-2-removebg-scaled-e1752152009924-7iV2qZXAcVUCou9o.png';

let cachedMenuBackgroundImage: Buffer | null | undefined;
let cachedMenuLogoImage: Buffer | null | undefined;

interface PdfMenuPack {
  id: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  items: Array<{
    itemType: string;
    itemTypeOrder: number;
    itemName: string;
  }>;
}

async function getMenuBackgroundImage(): Promise<Buffer | null> {
  if (cachedMenuBackgroundImage !== undefined) {
    return cachedMenuBackgroundImage;
  }

  try {
    const response = await fetch(MENU_BACKGROUND_IMAGE_URL);
    if (!response.ok) {
      throw new Error(`Failed to download menu background (${response.status})`);
    }
    const imageArrayBuffer = await response.arrayBuffer();
    cachedMenuBackgroundImage = Buffer.from(imageArrayBuffer);
  } catch (error) {
    cachedMenuBackgroundImage = null;
  }

  return cachedMenuBackgroundImage;
}

async function getMenuLogoImage(): Promise<Buffer | null> {
  if (cachedMenuLogoImage !== undefined) {
    return cachedMenuLogoImage;
  }

  try {
    const response = await fetch(MENU_LOGO_IMAGE_URL);
    if (!response.ok) {
      throw new Error(`Failed to download menu logo (${response.status})`);
    }
    const imageArrayBuffer = await response.arrayBuffer();
    cachedMenuLogoImage = Buffer.from(imageArrayBuffer);
  } catch (error) {
    cachedMenuLogoImage = null;
  }

  return cachedMenuLogoImage;
}

function formatDateForPdf(value?: Date | string | null): string {
  if (!value) return '-';
  const asDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(asDate.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(asDate);
}

function normalizeTimeText(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return trimmed;
  const hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return trimmed;
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(twelveHour).padStart(2, '0')}:${minute} ${meridiem}`;
}

function resolveTimeRange(
  bookingTimes: { functionTime?: string | null; startTime?: string | null; endTime?: string | null },
  packs: PdfMenuPack[]
): string {
  if (packs.length === 1) {
    const from = normalizeTimeText(packs[0].startTime);
    const to = normalizeTimeText(packs[0].endTime);
    if (from && to) return `${from} to ${to}`;
    if (from) return from;
    if (to) return to;
  }

  const bookingStart = normalizeTimeText(bookingTimes.startTime);
  const bookingEnd = normalizeTimeText(bookingTimes.endTime);
  if (bookingStart && bookingEnd) return `${bookingStart} to ${bookingEnd}`;
  if (bookingStart) return bookingStart;
  if (bookingEnd) return bookingEnd;

  const functionTime = normalizeTimeText(bookingTimes.functionTime);
  return functionTime || '-';
}

function normalizeFilenameToken(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return normalized || 'menu';
}

function drawPageBackground(doc: PDFKit.PDFDocument, imageBuffer: Buffer | null): void {
  doc.save();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fdfcf8');
  doc.restore();
  if (!imageBuffer) return;
  try {
    doc.image(imageBuffer, 0, 0, {
      width: doc.page.width,
      height: doc.page.height,
    });
  } catch (error) {
    // Keep PDF generation resilient if the image cannot be rendered.
  }
}

function addDecoratedPage(doc: PDFKit.PDFDocument, imageBuffer: Buffer | null): void {
  doc.addPage({
    size: 'A4',
    margin: 0,
  });
  drawPageBackground(doc, imageBuffer);
}

function groupMenuItemsByType(
  items: Array<{ itemType: string; itemTypeOrder: number; itemName: string }>
): Array<{ groupName: string; order: number; itemNames: string[] }> {
  const groupMap = new Map<
    string,
    { groupName: string; order: number; itemNames: Set<string> }
  >();

  items.forEach((item) => {
    const groupName = item.itemType || 'Other';
    const groupOrder = Number.isFinite(item.itemTypeOrder)
      ? item.itemTypeOrder
      : 9999;
    const itemName = item.itemName || 'Unnamed Item';
    const key = `${groupOrder}::${groupName.toLowerCase()}`;
    const existing = groupMap.get(key) || {
      groupName,
      order: groupOrder,
      itemNames: new Set<string>(),
    };
    existing.itemNames.add(itemName);
    groupMap.set(key, existing);
  });

  return Array.from(groupMap.values())
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.groupName.localeCompare(b.groupName);
    })
    .map((group) => ({
      groupName: group.groupName,
      order: group.order,
      itemNames: Array.from(group.itemNames).sort((a, b) => a.localeCompare(b)),
    }));
}

function drawCoverPage(
  doc: PDFKit.PDFDocument,
  imageBuffer: Buffer | null,
  logoBuffer: Buffer | null,
  details: {
    customerName: string;
    customerPhone: string;
    functionType: string;
    functionDate: string;
    functionTiming: string;
    venue: string;
    menuLabel: string;
  }
): void {
  addDecoratedPage(doc, imageBuffer);

  const textWidth = doc.page.width - 220;
  const textLeft = 110;

  if (logoBuffer) {
    try {
      const logoWidth = 220;
      const logoHeight = 82;
      const logoX = (doc.page.width - logoWidth) / 2;
      doc.image(logoBuffer, logoX, 118, {
        fit: [logoWidth, logoHeight],
        align: 'center',
        valign: 'center',
      });
    } catch (error) {
      // Keep PDF generation resilient if the image cannot be rendered.
    }
  }

  doc.font('Times-Italic').fontSize(22).fillColor('#1f2937').text('Booking Details', textLeft, 258, {
    width: textWidth,
    align: 'center',
  });
  doc
    .moveTo(doc.page.width / 2 - 82, 293)
    .lineTo(doc.page.width / 2 + 82, 293)
    .strokeColor('#9ca3af')
    .lineWidth(1)
    .stroke();

  const rows: Array<[string, string]> = [
    ['Customer', details.customerName],
    ['Contact Number', details.customerPhone],
    ['Function Type', details.functionType],
    ['Date', details.functionDate],
    ['Timing', details.functionTiming],
    ['Venue', details.venue],
    ['Menu Selection', details.menuLabel],
  ];

  let y = 318;
  rows.forEach(([label, value]) => {
    doc.font('Times-Bold').fontSize(10).fillColor('#6b7280').text(label.toUpperCase(), textLeft, y, {
      width: textWidth,
      align: 'center',
      characterSpacing: 1.4,
    });
    y += 14;
    doc.font('Times-Roman').fontSize(16).fillColor('#111827').text(value || '-', textLeft, y, {
      width: textWidth,
      align: 'center',
    });
    y += 31;
  });
}

function drawMenuPages(
  doc: PDFKit.PDFDocument,
  imageBuffer: Buffer | null,
  packs: PdfMenuPack[]
): void {
  const contentLeft = 120;
  const contentWidth = doc.page.width - contentLeft * 2;
  const contentBottom = doc.page.height - 120;
  const menuTitleY = 116;
  const firstMenuStartY = 210;
  const continuationStartY = 132;
  const minItemsPerGroupSegment = 2;
  const groupHeaderBlockHeight = 40;
  const groupTailGap = 12;
  let y = continuationStartY;

  const getItemHeight = (itemName: string): number => {
    doc.font('Times-Italic').fontSize(16);
    return Math.max(
      22,
      doc.heightOfString(itemName, {
        width: contentWidth,
        align: 'center',
        lineGap: 2,
      }) + 6
    );
  };

  const sumHeights = (heights: number[], startIndex = 0, maxCount?: number): number => {
    const endIndex =
      maxCount === undefined
        ? heights.length
        : Math.min(heights.length, startIndex + Math.max(0, maxCount));
    let total = 0;
    for (let index = startIndex; index < endIndex; index += 1) {
      total += heights[index];
    }
    return total;
  };

  const countFittingItems = (
    heights: number[],
    startIndex: number,
    availableHeight: number
  ): number => {
    if (availableHeight <= 0) return 0;
    let used = 0;
    let count = 0;
    for (let index = startIndex; index < heights.length; index += 1) {
      if (used + heights[index] > availableHeight) break;
      used += heights[index];
      count += 1;
    }
    return count;
  };

  const startNewMenuPage = (showMenuHeading: boolean): void => {
    addDecoratedPage(doc, imageBuffer);
    if (showMenuHeading) {
      doc.font('Times-Bold').fontSize(52).fillColor('#111111').text('MENU', contentLeft, menuTitleY, {
        width: contentWidth,
        align: 'center',
        characterSpacing: 3,
      });
      y = firstMenuStartY;
      return;
    }
    y = continuationStartY;
  };

  const drawPackHeading = (packName: string): void => {
    doc.font('Times-Bold').fontSize(24).fillColor('#111111').text(packName.toUpperCase(), contentLeft, y, {
      width: contentWidth,
      align: 'center',
      characterSpacing: 1.8,
    });
    y += 30;
    doc
      .moveTo(doc.page.width / 2 - 110, y)
      .lineTo(doc.page.width / 2 + 110, y)
      .strokeColor('#9ca3af')
      .lineWidth(1)
      .stroke();
    y += 18;
  };

  const drawGroupHeading = (groupName: string): void => {
    doc.font('Times-Bold').fontSize(19).fillColor('#374151').text(groupName.toUpperCase(), contentLeft, y, {
      width: contentWidth,
      align: 'center',
      characterSpacing: 1.4,
    });
    y += 25;
    doc
      .moveTo(doc.page.width / 2 - 62, y)
      .lineTo(doc.page.width / 2 + 62, y)
      .strokeColor('#9ca3af')
      .lineWidth(1)
      .stroke();
    y += 15;
  };

  const pageCapacityWithoutMenuTitle = contentBottom - continuationStartY;

  startNewMenuPage(true);

  packs.forEach((pack, packIndex) => {
    const groupedItems = groupMenuItemsByType(pack.items);
    if (groupedItems.length === 0) return;

    if (packs.length > 1) {
      const requiredPackHeaderHeight = 52;
      if (y + requiredPackHeaderHeight > contentBottom) {
        startNewMenuPage(false);
      }
      drawPackHeading(pack.name);
    }

    groupedItems.forEach((group, groupIndex) => {
      const itemHeights = group.itemNames.map((itemName) => getItemHeight(itemName));
      const totalGroupHeight = groupHeaderBlockHeight + sumHeights(itemHeights) + groupTailGap;

      if (totalGroupHeight <= pageCapacityWithoutMenuTitle && y + totalGroupHeight > contentBottom) {
        startNewMenuPage(false);
      }

      let itemIndex = 0;
      let isContinuation = false;

      while (itemIndex < group.itemNames.length) {
        const remainingItems = group.itemNames.length - itemIndex;
        const minItemsToKeep = Math.min(minItemsPerGroupSegment, remainingItems);
        const minRequiredHeight =
          groupHeaderBlockHeight +
          sumHeights(itemHeights, itemIndex, minItemsToKeep) +
          groupTailGap;

        if (y + minRequiredHeight > contentBottom) {
          startNewMenuPage(false);
        }

        const heightLeftForItems = contentBottom - y - groupHeaderBlockHeight - groupTailGap;
        const fitCountHere = countFittingItems(itemHeights, itemIndex, heightLeftForItems);
        const remainingGroupHeight =
          groupHeaderBlockHeight + sumHeights(itemHeights, itemIndex) + groupTailGap;

        if (
          fitCountHere <= 1 &&
          remainingItems > 1 &&
          remainingGroupHeight <= pageCapacityWithoutMenuTitle
        ) {
          startNewMenuPage(false);
        }

        const headingLabel = isContinuation
          ? `${group.groupName} (cont.)`
          : group.groupName;
        drawGroupHeading(headingLabel);

        let itemsWrittenOnThisSegment = 0;
        while (itemIndex < group.itemNames.length) {
          const itemHeight = itemHeights[itemIndex];
          if (y + itemHeight + groupTailGap > contentBottom) {
            break;
          }

          doc.font('Times-Italic').fontSize(16).fillColor('#111111').text(group.itemNames[itemIndex], contentLeft, y, {
            width: contentWidth,
            align: 'center',
            lineGap: 2,
          });
          y += itemHeight;
          itemIndex += 1;
          itemsWrittenOnThisSegment += 1;
        }

        if (itemsWrittenOnThisSegment === 0) {
          // Fallback to prevent an infinite loop on pathological long text.
          doc.font('Times-Italic').fontSize(14).fillColor('#111111').text(group.itemNames[itemIndex], contentLeft, y, {
            width: contentWidth,
            align: 'center',
            lineGap: 2,
          });
          y += Math.min(contentBottom - y - groupTailGap, getItemHeight(group.itemNames[itemIndex]));
          itemIndex += 1;
        }

        y += groupTailGap;
        if (itemIndex < group.itemNames.length) {
          isContinuation = true;
          startNewMenuPage(false);
        }
      }

      y += 8;
      if (groupIndex === groupedItems.length - 1 && packIndex !== packs.length - 1) {
        y += 8;
      }
    });
  });
}

async function resolveMealSlotId(
  tx: Prisma.TransactionClient,
  pack: {
    mealSlotId?: string;
    packName?: string;
    startTime?: string;
    endTime?: string;
  }
): Promise<string> {
  if (pack.mealSlotId) {
    return pack.mealSlotId;
  }

  const normalizedPackName = (pack.packName || 'General').trim();
  const existingByName = await tx.mealSlot.findFirst({
    where: {
      name: {
        equals: normalizedPackName,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  if (existingByName) {
    return existingByName.id;
  }

  const created = await tx.mealSlot.create({
    data: {
      name: normalizedPackName || `Slot-${Date.now()}`,
      startTime: pack.startTime || '00:00',
      endTime: pack.endTime || '23:59',
      isActive: true,
      displayOrder: 0,
    },
    select: { id: true },
  });

  return created.id;
}

/**
 * Create new booking
 */
export async function createBooking(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data: any = normalizeCaseFields({ ...req.body }, [
      'functionName',
      'functionType',
    ]);

    if (Array.isArray(data.additionalItems)) {
      data.additionalItems = normalizeCaseInArrayObjects(data.additionalItems, [
        'description',
      ]);
    }

    if (Array.isArray(data.packs)) {
      data.packs = data.packs.map((pack: any) => {
        const normalizedPack = normalizeCaseFields({ ...pack }, [
          'packName',
          'hallName',
          'boardToRead',
          'timeSlot',
        ]);
        if (normalizedPack.menu && typeof normalizedPack.menu === 'object') {
          normalizedPack.menu = normalizeCaseFields(
            { ...normalizedPack.menu },
            ['name']
          );
        }
        return normalizedPack;
      });
    }

    const hallRowsInput = normalizeBookingHallRows(data.halls);

    // Start transaction
    const booking = await prisma.$transaction(async (tx) => {
      await assertSingleBanquetHallSelection(tx, hallRowsInput);

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          customerId: data.customerId,
          secondCustomerId: data.secondCustomerId,
          referredById: data.referredById,
          rating: data.rating,
          secondRating: data.secondRating,
          priority: data.priority,
          secondPriority: data.secondPriority,
          functionName: data.functionName,
          functionType: data.functionType,
          functionDate: new Date(data.functionDate),
          functionTime: data.functionTime,
          startTime: data.startTime,
          endTime: data.endTime,
          expectedGuests: data.expectedGuests,
          confirmedGuests: data.confirmedGuests,
          quotation:
            data.quotation !== undefined
              ? data.quotation
              : data.isQuotation || false,
          isQuotation: data.isQuotation || false,
          notes: data.notes,
          internalNotes: data.internalNotes,
        },
      });

      // Create hall associations
      if (hallRowsInput.length > 0) {
        await tx.bookingHall.createMany({
          data: hallRowsInput.map((hall) => ({
            bookingId: newBooking.id,
            hallId: hall.hallId,
            charges: hall.charges,
          })),
        });
      }

      // Create packs with menus
      if (data.packs && data.packs.length > 0) {
        for (const pack of data.packs) {
          const mealSlotId = await resolveMealSlotId(tx, pack);
          const normalizedPackCount = Math.max(
            1,
            toSafeNumber(pack.packCount ?? pack.noOfPack ?? 1)
          );

          // Create menu
          const menu = await tx.bookingMenu.create({
            data: {
              name: pack.menu?.name || `${pack.packName || 'Menu'} Menu`,
              setupCost: pack.setupCost || 0,
              ratePerPlate: pack.ratePerPlate,
              mealSlotId,
            },
          });

          // Add menu items
          if (pack.menu?.items && pack.menu.items.length > 0) {
            await tx.bookingMenuItems.createMany({
              data: pack.menu.items.map((item: any) => ({
                bookingMenuId: menu.id,
                itemId: item.itemId,
                quantity: item.quantity,
              })),
            });
          }

          // Create pack
          await tx.bookingPack.create({
            data: {
              bookingId: newBooking.id,
              mealSlotId,
              bookingMenuId: menu.id,
              packName: pack.packName,
              noOfPack: Math.max(1, toSafeNumber(pack.noOfPack ?? normalizedPackCount)),
              packCount: normalizedPackCount,
              hallIds: pack.hallIds || [],
              ratePerPlate: pack.ratePerPlate,
              setupCost: pack.setupCost || 0,
              startTime: pack.startTime,
              endTime: pack.endTime,
              extraPlate: pack.extraPlate,
              extraRate: pack.extraRate,
              extraAmount: pack.extraAmount,
              menuPoint: pack.menuPoint,
              hallRate: pack.hallRate,
              boardToRead: pack.boardToRead,
              extraCharges: pack.extraCharges || 0,
              hallName: pack.hallName,
              timeSlot: pack.timeSlot,
              tags: pack.tags || [],
            },
          });
        }
      }

      // Create additional items
      if (data.additionalItems && data.additionalItems.length > 0) {
        await tx.additionalBookingItems.createMany({
          data: data.additionalItems.map((item: any) => ({
            bookingId: newBooking.id,
            description: item.description,
            charges: item.charges,
            quantity: item.quantity || 1,
          })),
        });
      }

      // Calculate totals
      let totalAmount = 0;

      // Add hall charges
      if (hallRowsInput.length > 0) {
        totalAmount += hallRowsInput.reduce((sum: number, h) => sum + h.charges, 0);
      }

      // Add pack charges
      if (data.packs) {
        for (const pack of data.packs) {
          const normalizedPackCount = Math.max(
            1,
            toSafeNumber(pack.packCount ?? pack.noOfPack ?? 1)
          );
          const packTotal =
            (pack.ratePerPlate * normalizedPackCount) +
            (pack.setupCost || 0) +
            (pack.extraCharges || 0);
          totalAmount += packTotal;
        }
      }

      // Add additional items
      if (data.additionalItems) {
        totalAmount += data.additionalItems.reduce(
          (sum: number, item: any) => sum + item.charges * (item.quantity || 1),
          0
        );
      }

      // Calculate discount
      let discountAmount = data.discountAmount || 0;
      if (data.discountPercentage && data.discountPercentage > 0) {
        discountAmount = (totalAmount * data.discountPercentage) / 100;
      }

      const grandTotal = totalAmount - discountAmount;
      const balanceAmount = grandTotal - (data.advanceReceived || 0);

      // Update booking with totals
      return await tx.booking.update({
        where: { id: newBooking.id },
        data: {
          totalAmount,
          totalBillAmount: `${totalAmount}`,
          discountAmount,
          discountPercentage: data.discountPercentage || 0,
          discountAmount2nd:
            data.discountAmount2nd !== undefined
              ? `${data.discountAmount2nd}`
              : undefined,
          discountPercentage2nd:
            data.discountPercentage2nd !== undefined
              ? `${data.discountPercentage2nd}`
              : undefined,
          grandTotal,
          finalAmount: `${grandTotal}`,
          balanceAmount,
          dueAmount: `${balanceAmount}`,
          advanceRequired:
            data.advanceRequired !== undefined
              ? `${data.advanceRequired}`
              : undefined,
          paymentReceivedPercent:
            data.paymentReceivedPercent !== undefined
              ? `${data.paymentReceivedPercent}`
              : undefined,
          paymentReceivedAmount:
            data.paymentReceivedAmount !== undefined
              ? `${data.paymentReceivedAmount}`
              : undefined,
        },
        include: {
          customer: true,
          secondCustomer: true,
          halls: {
            include: {
              hall: true,
            },
          },
          packs: {
            include: {
              mealSlot: true,
              bookingMenu: {
                include: {
                  items: {
                    include: {
                      item: true,
                    },
                  },
                },
              },
            },
          },
          additionalItems: true,
        },
      });
    });

    await syncBookingEventToGoogleCalendar(booking);

    sendSuccess(res, { booking }, 'Booking created successfully', 201);
  } catch (error: any) {
    console.error('Booking creation error:', error);
    if (error instanceof Error) {
      if (
        error.message === 'Selected halls must belong to the same banquet' ||
        error.message === 'One or more selected halls are invalid'
      ) {
        sendError(res, error.message, 400);
        return;
      }
    }
    sendError(res, 'Failed to create booking');
  }
}

/**
 * Get all bookings with filters
 */
export async function getBookings(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    const isQuotation = req.query.isQuotation === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isLatest: true };

    if (status) {
      where.status = status;
    }

    if (isQuotation !== undefined) {
      where.isQuotation = isQuotation;
    }

    if (search) {
      where.OR = [
        { functionName: { contains: search, mode: 'insensitive' } },
        { functionType: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    if (fromDate || toDate) {
      where.functionDate = {};
      if (fromDate) {
        where.functionDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.functionDate.lte = new Date(toDate);
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { functionDate: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          halls: {
            include: {
              hall: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              payments: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    sendSuccess(res, {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch bookings');
  }
}

/**
 * Get booking by ID
 */
export async function getBookingById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        secondCustomer: true,
        halls: {
          include: {
            hall: true,
          },
        },
        packs: {
          include: {
            mealSlot: true,
            bookingMenu: {
              include: {
                items: {
                  include: {
                    item: {
                      include: {
                        itemType: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        additionalItems: true,
        payments: {
          include: {
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        previousBooking: true,
        nextVersion: true,
      },
    });

    if (!booking) {
      sendNotFound(res, 'Booking not found');
      return;
    }

    sendSuccess(res, { booking });
  } catch (error) {
    sendError(res, 'Failed to fetch booking');
  }
}

/**
 * Download booking menu PDF
 */
export async function downloadBookingMenuPdf(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const packId = typeof req.query.packId === 'string' ? req.query.packId : undefined;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        halls: {
          include: {
            hall: {
              include: {
                banquet: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        packs: {
          orderBy: [
            { startTime: 'asc' },
            { createdAt: 'asc' },
          ],
          include: {
            mealSlot: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
              },
            },
            bookingMenu: {
              include: {
                items: {
                  include: {
                    item: {
                      select: {
                        id: true,
                        name: true,
                        itemType: {
                          select: {
                            id: true,
                            name: true,
                            order: true,
                            displayOrder: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      sendNotFound(res, 'Booking not found');
      return;
    }

    const mappedPacks: PdfMenuPack[] = booking.packs
      .map((pack) => ({
        id: pack.id,
        name:
          (pack.packName || '').trim() ||
          (pack.mealSlot?.name || '').trim() ||
          (pack.bookingMenu?.name || '').trim() ||
          'Menu',
        startTime: pack.startTime || pack.mealSlot?.startTime || null,
        endTime: pack.endTime || pack.mealSlot?.endTime || null,
        items: (pack.bookingMenu?.items || [])
          .map((entry) => ({
            itemType: entry.item?.itemType?.name || 'Other',
            itemTypeOrder:
              typeof entry.item?.itemType?.order === 'number'
                ? entry.item.itemType.order
                : typeof entry.item?.itemType?.displayOrder === 'number'
                ? entry.item.itemType.displayOrder
                : 9999,
            itemName: entry.item?.name || 'Unnamed Item',
          }))
          .filter((entry) => Boolean(entry.itemName)),
      }))
      .filter((pack) => pack.items.length > 0);

    if (mappedPacks.length === 0) {
      sendError(res, 'No menu items available for this booking', 400);
      return;
    }

    const selectedPacks = packId
      ? mappedPacks.filter((pack) => pack.id === packId)
      : mappedPacks;

    if (selectedPacks.length === 0) {
      sendNotFound(res, 'Menu pack not found for this booking');
      return;
    }

    const venueParts = booking.halls
      .map((entry) => {
        if (!entry.hall) return '';
        if (entry.hall.banquet?.name) {
          return `${entry.hall.banquet.name} - ${entry.hall.name}`;
        }
        return entry.hall.name;
      })
      .filter(Boolean);
    const venueText = venueParts.length > 0 ? venueParts.join(', ') : '-';

    const customerName = booking.customer?.name || '-';
    const customerPhone = booking.customer?.phone || '-';
    const functionType = booking.functionType || '-';
    const functionDate = formatDateForPdf(booking.functionDate);
    const functionTiming = resolveTimeRange(
      {
        functionTime: booking.functionTime,
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
      selectedPacks
    );
    const menuLabel =
      selectedPacks.length === 1
        ? selectedPacks[0].name
        : `${selectedPacks.length} Menus`;

    const safeBookingName = normalizeFilenameToken(
      booking.functionName || booking.functionType || customerName || 'booking'
    );
    const safeMenuName = normalizeFilenameToken(
      selectedPacks.length === 1 ? selectedPacks[0].name : 'all-menus'
    );
    const fileName = `${safeBookingName}-${safeMenuName}-menu.pdf`;

    const [imageBuffer, logoBuffer] = await Promise.all([
      getMenuBackgroundImage(),
      getMenuLogoImage(),
    ]);
    const pdfDoc = new PDFDocument({
      size: 'A4',
      margin: 0,
      autoFirstPage: false,
      compress: true,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    pdfDoc.pipe(res);

    drawCoverPage(pdfDoc, imageBuffer, logoBuffer, {
      customerName,
      customerPhone,
      functionType,
      functionDate,
      functionTiming,
      venue: venueText,
      menuLabel,
    });
    drawMenuPages(pdfDoc, imageBuffer, selectedPacks);

    pdfDoc.end();
  } catch (error) {
    sendError(res, 'Failed to generate booking menu PDF');
  }
}

/**
 * Update booking
 */
export async function updateBooking(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const data: any = normalizeCaseFields({ ...req.body }, [
      'functionName',
      'functionType',
    ]);

    if (Array.isArray(data.additionalItems)) {
      data.additionalItems = normalizeCaseInArrayObjects(data.additionalItems, [
        'description',
      ]);
    }

    if (Array.isArray(data.packs)) {
      data.packs = data.packs.map((pack: any) => {
        const normalizedPack = normalizeCaseFields({ ...pack }, [
          'packName',
          'hallName',
          'boardToRead',
          'timeSlot',
        ]);
        if (normalizedPack.menu && typeof normalizedPack.menu === 'object') {
          normalizedPack.menu = normalizeCaseFields(
            { ...normalizedPack.menu },
            ['name']
          );
        }
        return normalizedPack;
      });
    }

    const hallRowsInput = Array.isArray(data.halls)
      ? normalizeBookingHallRows(data.halls)
      : null;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      sendNotFound(res, 'Booking not found');
      return;
    }

    // Create new version if not a quotation
    if (!existingBooking.isQuotation && data.createNewVersion) {
      // Mark current as not latest
      await prisma.booking.update({
        where: { id },
        data: { isLatest: false },
      });

      // Create new version
      const newVersion = await prisma.booking.create({
        data: {
          ...existingBooking,
          id: undefined, // Let Prisma generate new ID
          previousBookingId: id,
          versionNumber: existingBooking.versionNumber + 1,
          isLatest: true,
          updatedAt: new Date(),
        } as any,
      });

      await cancelBookingEventInGoogleCalendar(id);
      await syncBookingEventToGoogleCalendar(newVersion);

      sendSuccess(res, { booking: newVersion }, 'New booking version created');
      return;
    }

    const booking = await prisma.$transaction(async (tx) => {
      if (hallRowsInput) {
        await assertSingleBanquetHallSelection(tx, hallRowsInput);
      }

      await tx.booking.update({
        where: { id },
        data: {
          customerId: data.customerId,
          secondCustomerId: data.secondCustomerId,
          referredById: data.referredById,
          rating: data.rating,
          secondRating: data.secondRating,
          priority: data.priority,
          secondPriority: data.secondPriority,
          functionName: data.functionName,
          functionType: data.functionType,
          functionDate: data.functionDate ? new Date(data.functionDate) : undefined,
          functionTime: data.functionTime,
          startTime: data.startTime,
          endTime: data.endTime,
          expectedGuests: data.expectedGuests,
          confirmedGuests: data.confirmedGuests,
          quotation:
            data.quotation !== undefined
              ? data.quotation
              : data.isQuotation !== undefined
              ? data.isQuotation
              : undefined,
          isQuotation: data.isQuotation,
          notes: data.notes,
          internalNotes: data.internalNotes,
          advanceRequired:
            data.advanceRequired !== undefined ? `${data.advanceRequired}` : undefined,
          paymentReceivedPercent:
            data.paymentReceivedPercent !== undefined
              ? `${data.paymentReceivedPercent}`
              : undefined,
          paymentReceivedAmount:
            data.paymentReceivedAmount !== undefined
              ? `${data.paymentReceivedAmount}`
              : undefined,
          dueAmount: data.dueAmount !== undefined ? `${data.dueAmount}` : undefined,
        },
      });

      if (hallRowsInput) {
        await tx.bookingHall.deleteMany({ where: { bookingId: id } });
        if (hallRowsInput.length > 0) {
          await tx.bookingHall.createMany({
            data: hallRowsInput.map((hall) => ({
              bookingId: id,
              hallId: hall.hallId,
              charges: toSafeNumber(hall.charges),
            })),
          });
        }
      }

      if (Array.isArray(data.additionalItems)) {
        await tx.additionalBookingItems.deleteMany({ where: { bookingId: id } });
        if (data.additionalItems.length > 0) {
          await tx.additionalBookingItems.createMany({
            data: data.additionalItems.map(
              (item: { description: string; charges?: number; quantity?: number }) => ({
                bookingId: id,
                description: item.description,
                charges: toSafeNumber(item.charges),
                quantity: Math.max(1, toSafeNumber(item.quantity || 1)),
              })
            ),
          });
        }
      }

      if (Array.isArray(data.packs)) {
        const existingPacks = await tx.bookingPack.findMany({
          where: { bookingId: id },
          select: {
            bookingMenuId: true,
          },
        });
        const existingMenuIds = existingPacks
          .map((pack) => pack.bookingMenuId)
          .filter(Boolean);

        await tx.bookingPack.deleteMany({ where: { bookingId: id } });
        if (existingMenuIds.length > 0) {
          await tx.bookingMenu.deleteMany({
            where: { id: { in: existingMenuIds } },
          });
        }

        for (const pack of data.packs) {
          const mealSlotId = await resolveMealSlotId(tx, pack);
          const normalizedPackCount = Math.max(
            1,
            toSafeNumber(pack.packCount ?? pack.noOfPack ?? 1)
          );

          const menu = await tx.bookingMenu.create({
            data: {
              name: pack.menu?.name || `${pack.packName || 'Menu'} Menu`,
              setupCost: toSafeNumber(pack.setupCost),
              ratePerPlate: toSafeNumber(pack.ratePerPlate),
              mealSlotId,
            },
          });

          if (pack.menu?.items && pack.menu.items.length > 0) {
            await tx.bookingMenuItems.createMany({
              data: pack.menu.items.map(
                (item: { itemId: string; quantity?: number }) => ({
                  bookingMenuId: menu.id,
                  itemId: item.itemId,
                  quantity: Math.max(1, toSafeNumber(item.quantity || 1)),
                })
              ),
            });
          }

          await tx.bookingPack.create({
            data: {
              bookingId: id,
              mealSlotId,
              bookingMenuId: menu.id,
              packName: pack.packName,
              noOfPack: Math.max(1, toSafeNumber(pack.noOfPack ?? normalizedPackCount)),
              packCount: normalizedPackCount,
              hallIds: pack.hallIds || [],
              ratePerPlate: toSafeNumber(pack.ratePerPlate),
              setupCost: toSafeNumber(pack.setupCost),
              startTime: pack.startTime,
              endTime: pack.endTime,
              extraPlate: pack.extraPlate,
              extraRate: pack.extraRate,
              extraAmount: pack.extraAmount,
              menuPoint: pack.menuPoint,
              hallRate: pack.hallRate,
              boardToRead: pack.boardToRead,
              extraCharges: toSafeNumber(pack.extraCharges),
              hallName: pack.hallName,
              timeSlot: pack.timeSlot,
              tags: pack.tags || [],
            },
          });
        }
      }

      const hallRows = hallRowsInput
        ? hallRowsInput
        : await tx.bookingHall.findMany({
            where: { bookingId: id },
            select: {
              charges: true,
            },
          });
      const packRows = Array.isArray(data.packs)
        ? data.packs
        : await tx.bookingPack.findMany({
            where: { bookingId: id },
            select: {
              packCount: true,
              noOfPack: true,
              ratePerPlate: true,
              setupCost: true,
              extraCharges: true,
            },
          });
      const additionalItemRows = Array.isArray(data.additionalItems)
        ? data.additionalItems
        : await tx.additionalBookingItems.findMany({
            where: { bookingId: id },
            select: {
              charges: true,
              quantity: true,
            },
          });

      const hallTotal = hallRows.reduce(
        (sum: number, hall: { charges?: number }) => sum + toSafeNumber(hall.charges),
        0
      );
      const packTotal = packRows.reduce(
        (sum: number, pack: any) =>
          sum +
          toSafeNumber(pack.ratePerPlate) *
            Math.max(1, toSafeNumber(pack.packCount ?? pack.noOfPack ?? 1)) +
          toSafeNumber(pack.setupCost) +
          toSafeNumber(pack.extraCharges),
        0
      );
      const additionalItemsTotal = additionalItemRows.reduce(
        (sum: number, item: { charges?: number; quantity?: number }) =>
          sum +
          toSafeNumber(item.charges) *
            Math.max(1, toSafeNumber(item.quantity || 1)),
        0
      );

      const totalAmount = hallTotal + packTotal + additionalItemsTotal;
      let discountAmount = toSafeNumber(data.discountAmount);
      if (toSafeNumber(data.discountPercentage) > 0) {
        discountAmount = (totalAmount * toSafeNumber(data.discountPercentage)) / 100;
      }
      const grandTotal = Math.max(0, totalAmount - discountAmount);
      const paymentReceived = toSafeNumber(data.paymentReceivedAmount);
      const balanceAmount = grandTotal - paymentReceived;

      await tx.booking.update({
        where: { id },
        data: {
          totalAmount,
          totalBillAmount: `${totalAmount}`,
          discountAmount,
          discountPercentage: toSafeNumber(data.discountPercentage),
          grandTotal,
          finalAmount:
            data.finalAmount !== undefined ? `${data.finalAmount}` : `${grandTotal}`,
          balanceAmount,
          dueAmount:
            data.dueAmount !== undefined ? `${data.dueAmount}` : `${balanceAmount}`,
        },
      });

      return tx.booking.findUnique({
        where: { id },
        include: {
          customer: true,
          secondCustomer: true,
          halls: {
            include: {
              hall: true,
            },
          },
          packs: {
            include: {
              mealSlot: true,
              bookingMenu: {
                include: {
                  items: {
                    include: {
                      item: true,
                    },
                  },
                },
              },
            },
          },
          additionalItems: true,
        },
      });
    });

    if (!booking) {
      sendNotFound(res, 'Booking not found');
      return;
    }

    await syncBookingEventToGoogleCalendar(booking);

    sendSuccess(res, { booking }, 'Booking updated successfully');
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'Selected halls must belong to the same banquet' ||
        error.message === 'One or more selected halls are invalid'
      ) {
        sendError(res, error.message, 400);
        return;
      }
    }
    sendError(res, 'Failed to update booking');
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
      },
    });

    await cancelBookingEventInGoogleCalendar(id);

    sendSuccess(res, { booking }, 'Booking cancelled successfully');
  } catch (error: any) {
    if (error.code === 'P2025') {
      sendNotFound(res, 'Booking not found');
    } else {
      sendError(res, 'Failed to cancel booking');
    }
  }
}

/**
 * Delete booking
 */
export async function deleteBooking(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.booking.delete({
      where: { id },
    });

    await cancelBookingEventInGoogleCalendar(id);

    sendSuccess(res, null, 'Booking deleted successfully');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendNotFound(res, 'Booking not found');
      return;
    }
    sendError(res, 'Failed to delete booking');
  }
}

/**
 * Add payment to booking
 */
export async function addPayment(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { amount, method, reference, narration, paymentDate } = req.body;

    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Create payment
      const newPayment = await tx.bookingPayments.create({
        data: {
          bookingId: id,
          receivedBy: req.user!.userId,
          amount,
          method,
          reference,
          narration,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        },
      });

      // Update booking balance
      const booking = await tx.booking.findUnique({
        where: { id },
      });

      if (booking) {
        await tx.booking.update({
          where: { id },
          data: {
            advanceReceived: booking.advanceReceived + amount,
            balanceAmount: booking.balanceAmount - amount,
          },
        });
      }

      return newPayment;
    });

    sendSuccess(res, { payment }, 'Payment added successfully', 201);
  } catch (error) {
    sendError(res, 'Failed to add payment');
  }
}
