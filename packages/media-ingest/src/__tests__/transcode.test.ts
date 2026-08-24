import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTranscodeArgs, proxyExtension } from '../transcode.js';

test('video command preserves timestamps and uses review proxy codec', () => {
  const args = buildTranscodeArgs('/input file.mp4', '/output.part', 'video', {
    maxLongEdge: 1280,
    videoCrf: 28,
    videoPreset: 'veryfast',
    audioBitrateKbps: 128,
  });
  assert.deepEqual(args.slice(0, 12), [
    '-nostdin',
    '-hide_banner',
    '-loglevel',
    'warning',
    '-y',
    '-copyts',
    '-start_at_zero',
    '-i',
    '/input file.mp4',
    '-map',
    '0:v:0',
    '-map',
  ]);
  assert.ok(args.includes('libx264'));
  assert.equal(proxyExtension('video'), '.mp4');
  assert.equal(proxyExtension('audio'), '.m4a');
});
