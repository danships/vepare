import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sha256File } from '../identity.js';

test('hashes file content without retaining it', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ingest-'));
  const file = path.join(directory, 'input.mp4');
  const data = Buffer.alloc(1024 * 1024, 7);
  await writeFile(file, data);
  assert.equal(await sha256File(file), createHash('sha256').update(data).digest('hex'));
});
