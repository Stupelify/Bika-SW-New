import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateDueAmount,
  resolveGrandTotalFromFinalAmount,
} from './bookingBilling.mjs';

test('resolveGrandTotalFromFinalAmount preserves an explicit zero', () => {
  assert.equal(resolveGrandTotalFromFinalAmount('0', 125000), 0);
});

test('calculateDueAmount uses zero final amount instead of falling back to base', () => {
  assert.equal(calculateDueAmount('0', 125000, 0), 0);
});

test('resolveGrandTotalFromFinalAmount falls back to billing base for blank input', () => {
  assert.equal(resolveGrandTotalFromFinalAmount('', 125000), 125000);
});
