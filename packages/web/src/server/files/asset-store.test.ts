import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AssetStoreError, inspectAsset } from './asset-store';

const roots: string[] = [];
async function root() {
  const directory = await mkdtemp(path.join(tmpdir(), 'assets-'));
  roots.push(directory);
  return directory;
}
const limits = (assetRoot: string, assetMaxBytes = 100) => ({
  assetRoot,
  assetMaxBytes,
  databaseUrl: 'sqlite://:memory:',
  apiKeys: [],
});
afterEach(async () => {
  await Promise.all(roots.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('inspectAsset', () => {
  it('hashes regular files and infers their MIME type', async () => {
    const directory = await root();
    await mkdir(path.join(directory, 'nested'));
    await writeFile(path.join(directory, 'nested', 'é.txt'), 'hello');
    await expect(inspectAsset('nested/é.txt', limits(directory))).resolves.toMatchObject({
      originalName: 'é.txt',
      mimeType: 'text/plain',
      sizeBytes: 5,
      sha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    });
  });
  it('rejects missing, non-files, symlinks, and oversized files', async () => {
    const directory = await root();
    await mkdir(path.join(directory, 'directory'));
    await writeFile(path.join(directory, 'large.bin'), '12345');
    await symlink('large.bin', path.join(directory, 'link'));
    for (const name of ['missing', 'directory', 'link'])
      await expect(inspectAsset(name, limits(directory))).rejects.toBeInstanceOf(AssetStoreError);
    await expect(inspectAsset('large.bin', limits(directory, 4))).rejects.toMatchObject({ code: 'FILE_TOO_LARGE' });
  });
});
