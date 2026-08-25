import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase } from '@/server/db/supersave';
import { registerFileAsset } from './service';

const oldEnvironment = { ...process.env };
const roots: string[] = [];
afterEach(async () => {
  await closeDatabase();
  process.env = { ...oldEnvironment };
  await Promise.all(roots.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('registerFileAsset', () => {
  it('creates immutable records and replays matching registrations', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'asset-service-'));
    roots.push(root);
    await writeFile(path.join(root, 'asset.bin'), 'contents');
    process.env.DATABASE_URL = 'sqlite://:memory:';
    process.env.ASSET_ROOT = root;
    process.env.ASSET_MAX_BYTES = '100';
    process.env.ASSET_REGISTRY_API_KEYS =
      '[{"principal":"ingest-worker","key":"01234567890123456789012345678901","scopes":["file-assets:register"]}]';
    const first = await registerFileAsset({ relativePath: 'asset.bin' }, 'ingest-worker');
    const replay = await registerFileAsset({ relativePath: 'asset.bin' }, 'ingest-worker');
    expect(first.kind).toBe('created');
    expect(replay).toMatchObject({ kind: 'existing', record: { createdBy: 'ingest-worker' } });
  });
});
