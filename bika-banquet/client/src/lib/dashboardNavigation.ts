export function buildBookingEditorHref(id: string): string {
  return `/dashboard/bookings?section=edit&id=${encodeURIComponent(id)}`;
}

export function buildEnquiryEditorHref(id: string): string {
  return `/dashboard/enquiries?section=edit&id=${encodeURIComponent(id)}`;
}

export function buildEventStreamUrl(baseUrl: string, token?: string | null): string {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const streamUrl = `${normalizedBase}/events`;
  if (!token) {
    return streamUrl;
  }
  return `${streamUrl}?token=${encodeURIComponent(token)}`;
}
