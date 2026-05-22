export function buildBookingEditorHref(id: string): string {
  return `/dashboard/bookings?section=edit&id=${encodeURIComponent(id)}`;
}

export function buildEnquiryEditorHref(id: string): string {
  return `/dashboard/enquiries?section=edit&id=${encodeURIComponent(id)}`;
}

export function buildSseEventStreamUrl(baseUrl: string, sseToken: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  return `${normalizedBase}/events?sse_token=${encodeURIComponent(sseToken)}`;
}
