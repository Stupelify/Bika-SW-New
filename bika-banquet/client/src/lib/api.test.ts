import test from 'node:test';
import assert from 'node:assert/strict';

import { getCacheSegmentsToInvalidate } from './apiCache.ts';

test('item type mutations invalidate cached items responses', () => {
  const segments = getCacheSegmentsToInvalidate('/item-types/11');

  assert.deepEqual(segments, ['item-types', 'items']);
});

test('item mutations still only invalidate item caches', () => {
  const segments = getCacheSegmentsToInvalidate('/items/22');

  assert.deepEqual(segments, ['items']);
});
