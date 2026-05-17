import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBookingEditorHref,
  buildEnquiryEditorHref,
  buildEventStreamUrl,
} from './dashboardNavigation.ts';

test('booking search href opens the existing booking editor route', () => {
  assert.equal(
    buildBookingEditorHref('booking-123'),
    '/dashboard/bookings?section=edit&id=booking-123'
  );
});

test('enquiry search href opens the existing enquiry editor route', () => {
  assert.equal(
    buildEnquiryEditorHref('enquiry-123'),
    '/dashboard/enquiries?section=edit&id=enquiry-123'
  );
});

test('event stream URL includes encoded token when provided', () => {
  assert.equal(
    buildEventStreamUrl('/api', 'token value'),
    '/api/events?token=token%20value'
  );
});
