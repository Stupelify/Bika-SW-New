import PDFDocument from 'pdfkit';
import { parentPort, workerData } from 'worker_threads';

type PdfMenuPack = {
  id: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  items: Array<{
    itemType: string;
    itemTypeOrder: number;
    itemName: string;
  }>;
};

type PdfWorkerPayload = {
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
};

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

async function generatePdfBuffer(payload: PdfWorkerPayload): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      autoFirstPage: false,
      compress: true,
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    doc.on('error', reject);
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    drawCoverPage(doc, payload.imageBuffer, payload.logoBuffer, {
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      functionType: payload.functionType,
      functionDate: payload.functionDate,
      functionTiming: payload.functionTiming,
      venue: payload.venue,
      menuLabel: payload.menuLabel,
    });
    drawMenuPages(doc, payload.imageBuffer, payload.selectedPacks);

    doc.end();
  });
}

async function main() {
  if (!parentPort) {
    throw new Error('PDF worker must be run as a worker thread');
  }

  const pdfBuffer = await generatePdfBuffer(workerData as PdfWorkerPayload);
  parentPort.postMessage(pdfBuffer);
}

void main();
