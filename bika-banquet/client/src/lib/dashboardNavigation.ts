export function buildBookingEditorHref(id: string): string {
  return `/dashboard/bookings?section=edit&id=${encodeURIComponent(id)}`;
}

export function buildEnquiryEditorHref(id: string): string {
  return `/dashboard/enquiries?section=edit&id=${encodeURIComponent(id)}`;
}

export function buildEventStreamUrl(baseUrl: string, _token?: string | null): string {
  // Note: EventSource does not support custom Authorization headers (browser limitation).
  // Token must be passed via HttpOnly cookie or other secure mechanism.
  // The _token parameter is deprecated and ignored for security reasons.
  const normalizedBase = baseUrl.replace(/\/$/, '');
  return `${normalizedBase}/events`;
}
