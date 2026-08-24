import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalJson, sha256Text } from '../manifest.js';

test('canonical JSON is deterministic and newline terminated', () => {
  const value = { schemaVersion: 1, mediaId: 'a' };
  assert.equal(canonicalJson(value), canonicalJson(value));
  assert.ok(canonicalJson(value).endsWith('\n'));
  assert.equal(sha256Text('same'), sha256Text('same'));
});
