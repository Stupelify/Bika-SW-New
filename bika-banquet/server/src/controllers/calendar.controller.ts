import { Request, Response } from 'express';
import { importGoogleCalendarEvents } from '../services/googleCalendar.service';
import { sendError, sendSuccess } from '../utils/response';

export async function getGoogleCalendarEvents(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const startDate =
      typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const result = await importGoogleCalendarEvents({ startDate, endDate });

    sendSuccess(res, {
      enabled: result.enabled,
      configured: result.configured,
      timezone: result.timezone,
      startDate: result.startDate,
      endDate: result.endDate,
      sourceCount: result.sourceCount,
      events: result.events,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch Google calendar events');
  }
}
