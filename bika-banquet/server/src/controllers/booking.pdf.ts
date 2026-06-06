/**
 * booking.pdf.ts
 * PDF generation handlers: menu PDF and booking details PDF.
 */
import path from 'path';
import { Worker } from 'worker_threads';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../config/database';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  BOOKING_RELATION_INCLUDE,
  getMenuBackgroundImage,
  getMenuLogoImage,
} from './booking.shared';
import {
  getVenueScope,
  withBookingBanquetScope,
} from '../utils/banquetAccess';
import {
  resolveDueAmount,
  resolvePaymentReceivedGross,
} from '@bika/booking-core';

// ---------------------------------------------------------------------------
// PDF drawing utilities
// ---------------------------------------------------------------------------

export interface PdfMenuPack {
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

export function formatDateForPdf(value?: Date | string | null): string {
  if (!value) return '-';
  const asDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(asDate.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(asDate);
}

export function normalizeTimeText(value?: string | null): string {
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

export function resolveTimeRange(
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

export function normalizeFilenameToken(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return normalized || 'menu';
}

export function drawPageBackground(doc: PDFKit.PDFDocument, imageBuffer: Buffer | null): void {
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

export function addDecoratedPage(doc: PDFKit.PDFDocument, imageBuffer: Buffer | null): void {
  doc.addPage({
    size: 'A4',
    margin: 0,
  });
  drawPageBackground(doc, imageBuffer);
}

export function groupMenuItemsByType(
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

export function drawCoverPage(
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

export function drawMenuPages(
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

async function generateBookingMenuPdfBuffer(payload: {
  customerName: string;
  customerPhone: string;
  functionType: string;
  functionDate: string;
  functionTiming: string;
  venue: string;
  menuLabel: string;
  selectedPacks: PdfMenuPack[];
  imageBuffer: Buffer | null;
  logoBuffer: Buffer | null;
}): Promise<Buffer> {
  const workerPath = path.resolve(__dirname, '../workers/pdfWorker.js');

  return new Promise<Buffer>((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: payload,
    });

    worker.once('message', (message: Buffer | Uint8Array) => {
      resolve(Buffer.isBuffer(message) ? message : Buffer.from(message));
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`PDF worker stopped with exit code ${code}`));
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * Download booking menu PDF
 */
export async function downloadBookingMenuPdf(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const packId = typeof req.query.packId === 'string' ? req.query.packId : undefined;
    const scope = getVenueScope(req);

    const booking = await prisma.booking.findFirst({
      where: withBookingBanquetScope({ id, isLatest: true }, scope),
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
          'Pack',
        startTime: pack.startTime || pack.mealSlot?.startTime || null,
        endTime: pack.endTime || pack.mealSlot?.endTime || null,
        items: (pack.bookingMenu?.items || [])
          .map((entry) => ({
            itemType: entry.item?.itemType?.name || 'Other',
            itemTypeOrder:
              entry.item?.itemType?.displayOrder ??
              entry.item?.itemType?.order ??
              9999,
            itemName: entry.item?.name || 'Unknown Item',
          }))
          .filter((item) => item.itemName !== 'Unknown Item' || item.itemType !== 'Other'),
      }))
      .filter((pack) => pack.items.length > 0);

    const selectedPacks = packId
      ? mappedPacks.filter((p) => p.id === packId)
      : mappedPacks;

    if (selectedPacks.length === 0) {
      sendError(res, 'No menu items found for the selected pack(s)', 404);
      return;
    }

    const [imageBuffer, logoBuffer] = await Promise.all([
      getMenuBackgroundImage(),
      getMenuLogoImage(),
    ]);

    const customer = booking.customer as any;
    const customerName = customer?.name || '-';
    const customerPhone = customer?.phone || '-';
    const halls = (booking.halls as any[]).map((h) => {
      const hall = h.hall;
      if (!hall) return '-';
      return hall.banquet?.name ? `${hall.banquet.name} – ${hall.name}` : hall.name;
    });
    const venueText = halls.length > 0 ? halls.join(', ') : '-';
    const functionDate = formatDateForPdf(booking.functionDate);
    const functionTiming = resolveTimeRange(
      { functionTime: booking.functionTime, startTime: booking.startTime, endTime: booking.endTime },
      selectedPacks
    );
    const menuLabel = selectedPacks.map((p) => p.name).join(' & ');
    const safeBookingName = normalizeFilenameToken(
      booking.functionName || booking.functionType || customerName || 'booking'
    );
    const fileName = `${safeBookingName}-menu.pdf`;

    const pdfBuffer = await generateBookingMenuPdfBuffer({
      customerName,
      customerPhone,
      functionType: booking.functionType || '-',
      functionDate,
      functionTiming,
      venue: venueText,
      menuLabel,
      selectedPacks,
      imageBuffer,
      logoBuffer,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    sendError(res, 'Failed to generate menu PDF');
  }
}

/**
 * Download booking details PDF
 */
export async function downloadBookingDetailsPdf(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const scope = getVenueScope(req);

    const booking = await prisma.booking.findFirst({
      where: withBookingBanquetScope({ id }, scope),
      include: BOOKING_RELATION_INCLUDE,
    });

    if (!booking) {
      sendNotFound(res, 'Booking not found');
      return;
    }

    const [imageBuffer, logoBuffer] = await Promise.all([
      getMenuBackgroundImage(),
      getMenuLogoImage(),
    ]);

    const fmt = (n: number | null | undefined) =>
      n != null ? `₹${n.toLocaleString('en-IN')}` : '-';

    const customerName = (booking.customer as any)?.name || '-';
    const customerPhone = (booking.customer as any)?.phone || '-';
    const secondCustomer = booking.secondCustomer as any;
    const functionDate = formatDateForPdf(booking.functionDate);
    const timing = resolveTimeRange(
      { functionTime: booking.functionTime, startTime: booking.startTime, endTime: booking.endTime },
      []
    );

    const halls = (booking.halls as any[]).map((h) => {
      const hall = h.hall;
      if (!hall) return '-';
      return hall.banquet?.name ? `${hall.banquet.name} – ${hall.name}` : hall.name;
    });
    const venueText = halls.length > 0 ? halls.join(', ') : '-';

    const packs = (booking.packs as any[]);
    const additionalItems = (booking.additionalItems as any[]) || [];
    const payments = (booking.payments as any[]) || [];

    const safeBookingName = normalizeFilenameToken(
      booking.functionName || booking.functionType || customerName || 'booking'
    );
    const fileName = `${safeBookingName}-booking-details.pdf`;

    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, compress: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    doc.pipe(res);

    // ── Page 1: Summary ──────────────────────────────────────────────────────
    doc.addPage({ size: 'A4', margin: 0 });
    drawPageBackground(doc, imageBuffer);

    const cL = 60;
    const cW = doc.page.width - cL * 2;

    // Logo
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, (doc.page.width - 200) / 2, 32, {
          fit: [200, 64],
          align: 'center',
          valign: 'center',
        });
      } catch { /* resilient */ }
    }

    // Heading
    doc.font('Times-Bold').fontSize(22).fillColor('#111827')
      .text('BOOKING DETAILS', cL, 114, { width: cW, align: 'center', characterSpacing: 2 });
    doc.moveTo(doc.page.width / 2 - 90, 145).lineTo(doc.page.width / 2 + 90, 145)
      .strokeColor('#9ca3af').lineWidth(1).stroke();

    // Status badge (text)
    const statusColors: Record<string, string> = {
      confirmed: '#15803d', cancelled: '#b91c1c', completed: '#1d4ed8',
    };
    const statusColor = statusColors[booking.status] || '#374151';
    doc.font('Times-Bold').fontSize(9).fillColor(statusColor)
      .text((booking.isQuotation ? 'QUOTATION' : booking.status.toUpperCase()), cL, 156, { width: cW, align: 'center', characterSpacing: 1.5 });

    // Details rows
    const detailRows: Array<[string, string]> = [
      ['Function', booking.functionName || '-'],
      ['Type', booking.functionType || '-'],
      ['Date', functionDate],
      ['Timing', timing || '-'],
      ['Expected Guests', String(booking.expectedGuests || '-')],
      ['Venue', venueText],
      ['Primary Customer', customerName],
      ['Contact', customerPhone],
    ];
    if (secondCustomer?.name) {
      detailRows.push(['Second Customer', `${secondCustomer.name}${secondCustomer.phone ? ` · ${secondCustomer.phone}` : ''}`]);
    }

    let y = 178;
    const colMid = doc.page.width / 2;
    const halfW = colMid - cL - 10;

    detailRows.forEach(([label, value], i) => {
      const x = i % 2 === 0 ? cL : colMid + 10;
      const w = halfW;
      if (i % 2 === 0 && i > 0) y += 44;
      doc.font('Times-Bold').fontSize(8).fillColor('#6b7280')
        .text(label.toUpperCase(), x, y, { width: w, characterSpacing: 1.2 });
      doc.font('Times-Roman').fontSize(13).fillColor('#111827')
        .text(value, x, y + 11, { width: w });
    });
    if (detailRows.length % 2 === 1) y += 44;
    y += 24;

    // Divider
    doc.moveTo(cL, y).lineTo(doc.page.width - cL, y).strokeColor('#e5e7eb').lineWidth(0.8).stroke();
    y += 14;

    // Financial summary box
    const finRows: Array<[string, string]> = [];
    if (booking.grandTotal) finRows.push(['Grand Total', fmt(booking.grandTotal)]);
    if (booking.discountAmount) finRows.push(['Discount', `- ${fmt(booking.discountAmount)}`]);
    if (booking.taxAmount) finRows.push(['Tax', fmt(booking.taxAmount)]);
    finRows.push(['Total Received', fmt(resolvePaymentReceivedGross(booking))]);
    finRows.push(['Balance Due', fmt(resolveDueAmount(booking))]);

    const boxH = 16 + finRows.length * 20 + 14;
    doc.roundedRect(cL, y, cW, boxH, 8).fillColor('#f9fafb').strokeColor('#e5e7eb').lineWidth(0.8).fillAndStroke();

    y += 12;
    finRows.forEach(([label, value]) => {
      const isBold = label === 'Grand Total' || label === 'Balance Due';
      const color = label === 'Balance Due' ? '#b91c1c' : '#111827';
      doc.font(isBold ? 'Times-Bold' : 'Times-Roman').fontSize(isBold ? 12 : 11)
        .fillColor('#6b7280').text(label, cL + 14, y, { width: cW / 2 - 14 });
      doc.font(isBold ? 'Times-Bold' : 'Times-Roman').fontSize(isBold ? 12 : 11)
        .fillColor(color).text(value, colMid, y, { width: cW / 2 - 14, align: 'right' });
      y += 20;
    });
    y += 14;

    // Notes
    if (booking.notes) {
      y += 8;
      doc.font('Times-Bold').fontSize(8).fillColor('#6b7280')
        .text('NOTES', cL, y, { characterSpacing: 1.2 });
      y += 12;
      doc.font('Times-Italic').fontSize(11).fillColor('#374151')
        .text(booking.notes, cL, y, { width: cW });
      y += doc.heightOfString(booking.notes, { width: cW }) + 8;
    }

    // ── Page 2: Packs + Payments (if any) ────────────────────────────────────
    if (packs.length > 0 || payments.length > 0 || additionalItems.length > 0) {
      doc.addPage({ size: 'A4', margin: 0 });
      drawPageBackground(doc, imageBuffer);
      y = 60;

      // Packs
      if (packs.length > 0) {
        doc.font('Times-Bold').fontSize(16).fillColor('#111827')
          .text('PACKS', cL, y, { width: cW, characterSpacing: 1.5 });
        y += 24;

        packs.forEach((pack: any) => {
          if (y > doc.page.height - 140) {
            doc.addPage({ size: 'A4', margin: 0 });
            drawPageBackground(doc, imageBuffer);
            y = 60;
          }
          const packName = (pack.packName || pack.mealSlot?.name || pack.bookingMenu?.name || 'Pack').trim();
          const startT = normalizeTimeText(pack.startTime || pack.mealSlot?.startTime);
          const endT = normalizeTimeText(pack.endTime || pack.mealSlot?.endTime);
          const timeStr = startT && endT ? `${startT} – ${endT}` : startT || endT || '';

          doc.font('Times-Bold').fontSize(13).fillColor('#1f2937')
            .text(packName, cL, y, { width: cW });
          y += 17;

          const packDetails: Array<[string, string]> = [
            ['Guests', String(pack.packCount || '-')],
            ['Rate / Plate', fmt(pack.ratePerPlate)],
          ];
          if (pack.hallRateValue != null) packDetails.push(['Hall Rate', fmt(pack.hallRateValue)]);
          if (pack.setupCost) packDetails.push(['Setup Cost', fmt(pack.setupCost)]);
          if (pack.extraPlate) packDetails.push(['Extra Plates', String(pack.extraPlate)]);
          if (pack.extraRateValue != null) packDetails.push(['Extra Rate', fmt(pack.extraRateValue)]);
          if (pack.extraAmountValue != null) packDetails.push(['Extra Amount', fmt(pack.extraAmountValue)]);
          if (timeStr) packDetails.push(['Timing', timeStr]);
          if (pack.boardToRead) packDetails.push(['Board Name', pack.boardToRead]);
          if (pack.notes) packDetails.push(['Notes', pack.notes]);

          packDetails.forEach(([label, val]) => {
            doc.font('Times-Roman').fontSize(11).fillColor('#6b7280')
              .text(`${label}:`, cL + 8, y, { width: 120, continued: false });
            doc.font('Times-Roman').fontSize(11).fillColor('#111827')
              .text(val, cL + 130, y, { width: cW - 130 });
            y += 15;
          });
          y += 12;
          doc.moveTo(cL, y).lineTo(doc.page.width - cL, y).strokeColor('#f3f4f6').lineWidth(0.6).stroke();
          y += 10;
        });
      }

      // Additional items
      if (additionalItems.length > 0) {
        if (y > doc.page.height - 160) {
          doc.addPage({ size: 'A4', margin: 0 });
          drawPageBackground(doc, imageBuffer);
          y = 60;
        }
        y += 8;
        doc.font('Times-Bold').fontSize(16).fillColor('#111827')
          .text('ADDITIONAL ITEMS', cL, y, { width: cW, characterSpacing: 1.5 });
        y += 24;

        additionalItems.forEach((item: any) => {
          doc.font('Times-Roman').fontSize(12).fillColor('#374151')
            .text(`${item.description}`, cL + 8, y, { width: cW - 120, continued: false });
          const total = (item.charges || 0) * (item.quantity || 1);
          doc.font('Times-Bold').fontSize(12).fillColor('#111827')
            .text(`${item.quantity > 1 ? `${item.quantity}×` : ''}${fmt(item.charges)} = ${fmt(total)}`,
              doc.page.width - cL - 150, y, { width: 150, align: 'right' });
          y += 18;
        });
        y += 8;
      }

      // Payments
      if (payments.length > 0) {
        if (y > doc.page.height - 160) {
          doc.addPage({ size: 'A4', margin: 0 });
          drawPageBackground(doc, imageBuffer);
          y = 60;
        }
        y += 8;
        doc.font('Times-Bold').fontSize(16).fillColor('#111827')
          .text('PAYMENTS RECEIVED', cL, y, { width: cW, characterSpacing: 1.5 });
        y += 24;

        payments
          .sort((a: any, b: any) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
          .forEach((pmt: any) => {
            const dateStr = formatDateForPdf(pmt.paymentDate);
            const method = pmt.paymentMethod ? ` · ${pmt.paymentMethod}` : '';
            const by = pmt.receiver?.name ? ` · ${pmt.receiver.name}` : '';
            const note = pmt.notes ? ` · ${pmt.notes}` : '';
            doc.font('Times-Roman').fontSize(11).fillColor('#374151')
              .text(`${dateStr}${method}${by}${note}`, cL + 8, y, { width: cW - 140 });
            doc.font('Times-Bold').fontSize(12).fillColor('#15803d')
              .text(fmt(pmt.amount), doc.page.width - cL - 120, y, { width: 120, align: 'right' });
            y += 18;
          });
      }
    }

    doc.end();
  } catch (error) {
    sendError(res, 'Failed to generate booking details PDF');
  }
}
