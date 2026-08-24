import { constants } from 'node:fs';
import { createReadStream } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { lookup } from 'mime-types';
import { getEnv } from '@/server/config/env';

export class AssetStoreError extends Error {
  constructor(
    public readonly code:
      'FILE_NOT_FOUND' | 'NOT_A_REGULAR_FILE' | 'FILE_TOO_LARGE' | 'FILE_CHANGED' | 'SERVICE_UNAVAILABLE'
  ) {
    super(code);
  }
}
type Identity = { dev: number; ino: number; size: number; mtimeMs: number };
const identity = (stat: { dev: number; ino: number; size: number; mtimeMs: number }): Identity => ({
  dev: stat.dev,
  ino: stat.ino,
  size: stat.size,
  mtimeMs: stat.mtimeMs,
});
const sameIdentity = (a: Identity, b: Identity) =>
  a.dev === b.dev && a.ino === b.ino && a.size === b.size && a.mtimeMs === b.mtimeMs;

export async function inspectAsset(
  relativePath: string,
  limits = getEnv()
): Promise<{ relativePath: string; originalName: string; mimeType: string; sizeBytes: number; sha256: string }> {
  let root: string;
  try {
    root = await realpath(limits.assetRoot);
  } catch {
    throw new AssetStoreError('SERVICE_UNAVAILABLE');
  }
  const pieces = relativePath.split('/');
  let candidate = root;
  try {
    for (const piece of pieces) {
      candidate = path.join(candidate, piece);
      const component = await lstat(candidate);
      if (component.isSymbolicLink()) throw new AssetStoreError('NOT_A_REGULAR_FILE');
    }
  } catch (error) {
    if (error instanceof AssetStoreError) throw error;
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new AssetStoreError('FILE_NOT_FOUND');
    throw new AssetStoreError('SERVICE_UNAVAILABLE');
  }
  const resolvedCandidate = await realpath(candidate);
  if (path.relative(root, resolvedCandidate).startsWith('..')) throw new AssetStoreError('NOT_A_REGULAR_FILE');
  let handle;
  try {
    handle = await open(candidate, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new AssetStoreError('FILE_NOT_FOUND');
    throw new AssetStoreError('NOT_A_REGULAR_FILE');
  }
  try {
    const before = await handle.stat();
    if (!before.isFile()) throw new AssetStoreError('NOT_A_REGULAR_FILE');
    if (before.size > limits.assetMaxBytes) throw new AssetStoreError('FILE_TOO_LARGE');
    const hash = createHash('sha256');
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream('', { fd: handle.fd, autoClose: false });
      stream.on('data', (chunk: string | Buffer) => {
        hash.update(chunk);
      });
      stream.once('end', resolve).once('error', reject);
    });
    const after = await handle.stat();
    const pathname = await lstat(candidate);
    if (!sameIdentity(identity(before), identity(after)) || !sameIdentity(identity(before), identity(pathname)))
      throw new AssetStoreError('FILE_CHANGED');
    const originalName = path.posix.basename(relativePath);
    return {
      relativePath,
      originalName,
      mimeType: (lookup(originalName) || 'application/octet-stream').toLowerCase(),
      sizeBytes: before.size,
      sha256: hash.digest('hex'),
    };
  } catch (error) {
    if (error instanceof AssetStoreError) throw error;
    throw new AssetStoreError('SERVICE_UNAVAILABLE');
  } finally {
    await handle.close();
  }
}
