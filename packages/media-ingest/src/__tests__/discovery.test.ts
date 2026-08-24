import assert from 'node:assert/strict';
import test from 'node:test';
import { isSupportedCandidate } from '../discovery.js';

test('filters source extensions and temporary files', () => {
  assert.equal(isSupportedCandidate('DJI.MP4'), true);
  assert.equal(isSupportedCandidate('sound.mp3'), true);
  assert.equal(isSupportedCandidate('.hidden.mp4'), false);
  assert.equal(isSupportedCandidate('copy.mp4.part'), false);
  assert.equal(isSupportedCandidate('image.mov'), false);
});
