import assert from 'node:assert/strict';
import test from 'node:test';

import { createSessionToken, matchesSecret } from './auth-crypto';

test('createSessionToken creates a deterministic HMAC-SHA-256 session token', () => {
  const presharedKey = 'abcdefghijklmnopqrstuvwxyz012345';
  const token = createSessionToken(presharedKey);

  assert.equal(token, 'f6cc970dfad491f245e3e8af900fff880bfbf03081576e4b7cfbde92e7ecb8b4');
  assert.equal(token, createSessionToken(presharedKey));
  assert.notEqual(token, createSessionToken('abcdefghijklmnopqrstuvwxyz012346'));
  assert.equal(token.includes(presharedKey), false);
});

test('matchesSecret accepts equal values and rejects different values', () => {
  assert.equal(matchesSecret('same secret', 'same secret'), true);
  assert.equal(matchesSecret('different-a', 'different-b'), false);
  assert.equal(matchesSecret('short', 'longer'), false);
});

test('matchesSecret compares UTF-8 byte sequences', () => {
  assert.equal(matchesSecret('café', 'café'), true);
  assert.equal(matchesSecret('é', 'e'), false);
  assert.equal(matchesSecret('猫', '犬'), false);
});
