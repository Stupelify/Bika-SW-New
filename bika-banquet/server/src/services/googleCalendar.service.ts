import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import logger from '../utils/logger';

type NullableString = string | null | undefined;

type CalendarDateRange = Pick<
  calendar_v3.Schema$Event,
  'start' | 'end'
>;

interface GoogleCalendarConfig {
  enabled: boolean;
  calendarId: string;
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
  timezone: string;
  clientUrl?: string;
}

interface BookingCalendarPayload {
  id: string;
  functionName: string;
  functionType?: NullableString;
  functionDate: Date | string;
  functionTime?: NullableString;
  startTime?: NullableString;
  endTime?: NullableString;
  expectedGuests?: number | null;
  confirmedGuests?: number | null;
  status?: NullableString;
  totalAmount?: number | null;
  grandTotal?: number | null;
  notes?: NullableString;
  customer?: {
    name?: NullableString;
    phone?: NullableString;
    email?: NullableString;
  } | null;
  halls?: Array<{
    hall?: {
      name?: NullableString;
    } | null;
  }> | null;
}

interface EnquiryCalendarPayload {
  id: string;
  functionName: string;
  functionType?: NullableString;
  functionDate: Date | string;
  functionTime?: NullableString;
  startTime?: NullableString;
  endTime?: NullableString;
  expectedGuests?: number | null;
  budgetPerPlate?: number | null;
  status?: NullableString;
  note?: NullableString;
  notes?: NullableString;
  specialRequirements?: NullableString;
  customer?: {
    name?: NullableString;
    phone?: NullableString;
    email?: NullableString;
  } | null;
  halls?: Array<{
    hall?: {
      name?: NullableString;
    } | null;
  }> | null;
}

const BOOKING_EVENT_PREFIX = 'bk';
const ENQUIRY_EVENT_PREFIX = 'enq';

function parseBoolean(value: NullableString): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function readGoogleCalendarConfig(): GoogleCalendarConfig {
  return {
    enabled: parseBoolean(process.env.GOOGLE_CALENDAR_SYNC_ENABLED),
    calendarId: (process.env.GOOGLE_CALENDAR_ID || '').trim(),
    serviceAccountEmail: (
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ''
    ).trim(),
    serviceAccountPrivateKey: (
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || ''
    ).replace(/\\n/g, '\n'),
    timezone:
      (process.env.GOOGLE_CALENDAR_TIMEZONE || '').trim() || 'Asia/Kolkata',
    clientUrl: (process.env.CLIENT_URL || '').trim() || undefined,
  };
}

async function getGoogleCalendarClient(): Promise<{
  calendar: calendar_v3.Calendar;
  config: GoogleCalendarConfig;
} | null> {
  const config = readGoogleCalendarConfig();

  if (!config.enabled) {
    return null;
  }

  if (
    !config.calendarId ||
    !config.serviceAccountEmail ||
    !config.serviceAccountPrivateKey
  ) {
    logger.warn(
      'Google Calendar sync is enabled but missing required configuration'
    );
    return null;
  }

  const auth = new google.auth.JWT({
    email: config.serviceAccountEmail,
    key: config.serviceAccountPrivateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return {
    calendar: google.calendar({ version: 'v3', auth }),
    config,
  };
}

function toGoogleEventId(prefix: string, entityId: string): string {
  const normalized = `${prefix}${entityId}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const withMinimumLength = normalized.length >= 5 ? normalized : `${normalized}00000`;
  return withMinimumLength.slice(0, 1024);
}

function getHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const candidate = error as {
    code?: unknown;
    response?: { status?: unknown };
  };
  if (typeof candidate.code === 'number') {
    return candidate.code;
  }
  if (candidate.response && typeof candidate.response.status === 'number') {
    return candidate.response.status;
  }
  return undefined;
}

function toDatePart(input: Date | string | null | undefined): string | null {
  if (!input) {
    return null;
  }
  if (typeof input === 'string') {
    const dateMatch = input.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }
  }
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

function parseTime(
  input?: NullableString
): { hours: number; minutes: number } | null {
  if (!input) {
    return null;
  }
  const normalized = input.trim().toLowerCase();
  const match = normalized.match(
    /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?$/
  );
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] || '0');
  const meridiem = match[3];

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return null;
    }
    if (hours === 12) {
      hours = 0;
    }
    if (meridiem === 'pm') {
      hours += 12;
    }
  } else if (hours > 23) {
    return null;
  }

  return { hours, minutes };
}

function pad2(value: number): string {
  return `${value}`.padStart(2, '0');
}

function addDays(datePart: string, days: number): string {
  const parsed = new Date(`${datePart}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function buildCalendarDateRange(
  functionDate: Date | string,
  startTime: NullableString,
  endTime: NullableString,
  timezone: string
): CalendarDateRange {
  const datePart = toDatePart(functionDate) || new Date().toISOString().slice(0, 10);
  const parsedStart = parseTime(startTime);

  if (!parsedStart) {
    return {
      start: { date: datePart },
      end: { date: addDays(datePart, 1) },
    };
  }

  const parsedEnd = parseTime(endTime);
  let endHours = parsedEnd ? parsedEnd.hours : parsedStart.hours + 2;
  let endMinutes = parsedEnd ? parsedEnd.minutes : parsedStart.minutes;
  let endDate = datePart;

  if (!parsedEnd && endHours >= 24) {
    endHours -= 24;
    endDate = addDays(datePart, 1);
  }

  if (
    parsedEnd &&
    (parsedEnd.hours < parsedStart.hours ||
      (parsedEnd.hours === parsedStart.hours &&
        parsedEnd.minutes <= parsedStart.minutes))
  ) {
    endDate = addDays(datePart, 1);
  }

  return {
    start: {
      dateTime: `${datePart}T${pad2(parsedStart.hours)}:${pad2(
        parsedStart.minutes
      )}:00`,
      timeZone: timezone,
    },
    end: {
      dateTime: `${endDate}T${pad2(endHours)}:${pad2(endMinutes)}:00`,
      timeZone: timezone,
    },
  };
}

function extractHallNames(
  halls:
    | Array<{
        hall?: {
          name?: NullableString;
        } | null;
      }>
    | null
    | undefined
): string[] {
  if (!Array.isArray(halls)) {
    return [];
  }
  return halls
    .map((entry) => entry?.hall?.name?.trim())
    .filter((name): name is string => Boolean(name));
}

function appendLine(lines: string[], label: string, value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }
  const text = `${value}`.trim();
  if (!text) {
    return;
  }
  lines.push(`${label}: ${text}`);
}

function buildBookingDescription(payload: BookingCalendarPayload): string {
  const lines: string[] = [];
  appendLine(lines, 'Type', payload.functionType);
  appendLine(lines, 'Booking ID', payload.id);
  appendLine(lines, 'Customer', payload.customer?.name);
  appendLine(lines, 'Phone', payload.customer?.phone);
  appendLine(lines, 'Email', payload.customer?.email);
  appendLine(lines, 'Expected Guests', payload.expectedGuests);
  appendLine(lines, 'Confirmed Guests', payload.confirmedGuests);
  appendLine(lines, 'Status', payload.status || 'confirmed');
  appendLine(lines, 'Total Amount', payload.totalAmount);
  appendLine(lines, 'Grand Total', payload.grandTotal);
  appendLine(lines, 'Notes', payload.notes);
  return lines.join('\n');
}

function buildEnquiryDescription(payload: EnquiryCalendarPayload): string {
  const lines: string[] = [];
  appendLine(lines, 'Type', payload.functionType);
  appendLine(lines, 'Enquiry ID', payload.id);
  appendLine(lines, 'Customer', payload.customer?.name);
  appendLine(lines, 'Phone', payload.customer?.phone);
  appendLine(lines, 'Email', payload.customer?.email);
  appendLine(lines, 'Expected Guests', payload.expectedGuests);
  appendLine(lines, 'Budget Per Plate', payload.budgetPerPlate);
  appendLine(lines, 'Status', payload.status || 'pending');
  appendLine(lines, 'Special Requirements', payload.specialRequirements);
  appendLine(lines, 'Notes', payload.notes || payload.note);
  return lines.join('\n');
}

async function upsertEvent(
  eventId: string,
  buildEvent: (config: GoogleCalendarConfig) => calendar_v3.Schema$Event
): Promise<void> {
  const client = await getGoogleCalendarClient();
  if (!client) {
    return;
  }

  const requestBody = buildEvent(client.config);

  try {
    await client.calendar.events.insert({
      calendarId: client.config.calendarId,
      requestBody: {
        ...requestBody,
        id: eventId,
      },
      sendUpdates: 'none',
    });
  } catch (error) {
    if (getHttpStatus(error) === 409) {
      await client.calendar.events.patch({
        calendarId: client.config.calendarId,
        eventId,
        requestBody,
        sendUpdates: 'none',
      });
      return;
    }
    throw error;
  }
}

async function cancelEvent(eventId: string): Promise<void> {
  const client = await getGoogleCalendarClient();
  if (!client) {
    return;
  }

  try {
    await client.calendar.events.patch({
      calendarId: client.config.calendarId,
      eventId,
      requestBody: { status: 'cancelled' },
      sendUpdates: 'none',
    });
  } catch (error) {
    if (getHttpStatus(error) === 404) {
      return;
    }
    throw error;
  }
}

export async function syncBookingEventToGoogleCalendar(
  payload: BookingCalendarPayload
): Promise<void> {
  try {
    if (!payload?.id) {
      return;
    }

    if ((payload.status || '').toLowerCase() === 'cancelled') {
      await cancelBookingEventInGoogleCalendar(payload.id);
      return;
    }

    const eventId = toGoogleEventId(BOOKING_EVENT_PREFIX, payload.id);
    const hallNames = extractHallNames(payload.halls).join(', ');

    await upsertEvent(eventId, (config) => {
      const dateRange = buildCalendarDateRange(
        payload.functionDate,
        payload.startTime || payload.functionTime,
        payload.endTime,
        config.timezone
      );

      return {
        summary: `Booking: ${payload.functionName}`,
        description: buildBookingDescription(payload),
        location: hallNames || undefined,
        status: 'confirmed',
        source: config.clientUrl
          ? {
              title: 'Bika Banquet',
              url: config.clientUrl,
            }
          : undefined,
        start: dateRange.start,
        end: dateRange.end,
      };
    });
  } catch (error) {
    logger.error('Failed to sync booking with Google Calendar', {
      bookingId: payload?.id,
      error,
    });
  }
}

export async function cancelBookingEventInGoogleCalendar(
  bookingId: string
): Promise<void> {
  try {
    if (!bookingId) {
      return;
    }
    const eventId = toGoogleEventId(BOOKING_EVENT_PREFIX, bookingId);
    await cancelEvent(eventId);
  } catch (error) {
    logger.error('Failed to cancel booking event in Google Calendar', {
      bookingId,
      error,
    });
  }
}

export async function syncEnquiryEventToGoogleCalendar(
  payload: EnquiryCalendarPayload
): Promise<void> {
  try {
    if (!payload?.id) {
      return;
    }

    if ((payload.status || '').toLowerCase() === 'cancelled') {
      await cancelEnquiryEventInGoogleCalendar(payload.id);
      return;
    }

    const eventId = toGoogleEventId(ENQUIRY_EVENT_PREFIX, payload.id);
    const hallNames = extractHallNames(payload.halls).join(', ');

    await upsertEvent(eventId, (config) => {
      const dateRange = buildCalendarDateRange(
        payload.functionDate,
        payload.startTime || payload.functionTime,
        payload.endTime,
        config.timezone
      );

      return {
        summary: `Enquiry: ${payload.functionName}`,
        description: buildEnquiryDescription(payload),
        location: hallNames || undefined,
        status: 'confirmed',
        source: config.clientUrl
          ? {
              title: 'Bika Banquet',
              url: config.clientUrl,
            }
          : undefined,
        start: dateRange.start,
        end: dateRange.end,
      };
    });
  } catch (error) {
    logger.error('Failed to sync enquiry with Google Calendar', {
      enquiryId: payload?.id,
      error,
    });
  }
}

async function cancelEnquiryEventInGoogleCalendar(
  enquiryId: string
): Promise<void> {
  if (!enquiryId) {
    return;
  }
  await cancelEvent(toGoogleEventId(ENQUIRY_EVENT_PREFIX, enquiryId));
}

export async function removeEnquiryEventFromGoogleCalendar(
  enquiryId: string
): Promise<void> {
  try {
    if (!enquiryId) {
      return;
    }

    const client = await getGoogleCalendarClient();
    if (!client) {
      return;
    }

    await client.calendar.events.delete({
      calendarId: client.config.calendarId,
      eventId: toGoogleEventId(ENQUIRY_EVENT_PREFIX, enquiryId),
      sendUpdates: 'none',
    });
  } catch (error) {
    if (getHttpStatus(error) === 404) {
      return;
    }
    logger.error('Failed to delete enquiry event in Google Calendar', {
      enquiryId,
      error,
    });
  }
}
