export function parseDateInput(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function parseTimeToHoursMinutes(
  input: unknown
): { hours: number; minutes: number } | null {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampmMatch) {
    let hours = Number.parseInt(ampmMatch[1], 10);
    const minutes = Number.parseInt(ampmMatch[2], 10);
    const suffix = ampmMatch[3].toUpperCase();
    if (minutes < 0 || minutes > 59 || hours < 1 || hours > 12) return null;
    if (suffix === 'AM') {
      if (hours === 12) hours = 0;
    } else if (hours !== 12) {
      hours += 12;
    }
    return { hours, minutes };
  }

  const hhmmMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!hhmmMatch) return null;

  const hours = Number.parseInt(hhmmMatch[1], 10);
  const minutes = Number.parseInt(hhmmMatch[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function buildDateTimeFromDateAndTime(
  dateInput: unknown,
  timeInput: unknown
): Date | null {
  const date = parseDateInput(dateInput);
  const time = parseTimeToHoursMinutes(timeInput);
  if (!date || !time) return null;

  const composed = new Date(date);
  composed.setHours(time.hours, time.minutes, 0, 0);
  return composed;
}

export function resolveEventDateTimes(
  functionDateInput: unknown,
  preferredStartTime: unknown,
  preferredEndTime: unknown,
  fallbackTime?: unknown
): { startDateTime: Date | null; endDateTime: Date | null } {
  const startCandidate = preferredStartTime ?? fallbackTime;
  const startDateTime = buildDateTimeFromDateAndTime(functionDateInput, startCandidate);
  const endDateTime = buildDateTimeFromDateAndTime(functionDateInput, preferredEndTime);

  if (startDateTime && endDateTime && endDateTime < startDateTime) {
    const plusOneDay = new Date(endDateTime);
    plusOneDay.setDate(plusOneDay.getDate() + 1);
    return {
      startDateTime,
      endDateTime: plusOneDay,
    };
  }

  return { startDateTime, endDateTime };
}
