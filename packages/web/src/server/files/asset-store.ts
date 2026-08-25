import { constants } from 'node:fs';
import { createReadStream } from 'node:fs';
import { type FileHandle, lstat, open, realpath } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { promisify } from 'node:util';
import { lookup } from 'mime-types';
import { getEnv } from '@/server/config/env';
import type { FileAssetRecord } from '@/features/file-assets/types';

const execFileAsync = promisify(execFile);
const playable = new Set(['video/mp4', 'video/webm']);

export class AssetStoreError extends Error {
  constructor(
    public readonly code:
      'FILE_NOT_FOUND' | 'NOT_A_REGULAR_FILE' | 'FILE_TOO_LARGE' | 'FILE_CHANGED' | 'SERVICE_UNAVAILABLE'
  ) {
    super(code);
  }
}
export async function openRegisteredAsset(record: FileAssetRecord) {
  const { inspected, handle } = await inspectAssetHandle(record.relativePath);
  if (inspected.sizeBytes !== record.sizeBytes || inspected.sha256 !== record.sha256) {
    await handle.close();
    throw new AssetStoreError('FILE_CHANGED');
  }
  return handle;
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

type InspectedAsset = {
  relativePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
};
export type PlaybackMetadata = {
  durationMs: number;
  videoFrameRateNumerator: number;
  videoFrameRateDenominator: number;
};
type ProbeOutput = {
  format?: { duration?: string };
  streams?: Array<{ avg_frame_rate?: string; r_frame_rate?: string }>;
};
const frameRate = (value: string | undefined) => {
  const match = /^(\d+)\/(\d+)$/.exec(value ?? '');
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  return Number.isSafeInteger(numerator) && Number.isSafeInteger(denominator) && numerator > 0 && denominator > 0
    ? { numerator, denominator }
    : null;
};
async function probePlaybackMetadata(handle: FileHandle): Promise<PlaybackMetadata> {
  try {
    const { stdout } = await execFileAsync(
      'ffprobe',
      [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'format=duration:stream=avg_frame_rate,r_frame_rate',
        '-of',
        'json',
        `/proc/${process.pid}/fd/${handle.fd}`,
      ],
      { maxBuffer: 1024 * 1024 }
    );
    const output = JSON.parse(stdout) as ProbeOutput;
    const durationMs = Math.round(Number(output.format?.duration));
    const rate = frameRate(output.streams?.[0]?.avg_frame_rate) ?? frameRate(output.streams?.[0]?.r_frame_rate);
    if (!Number.isSafeInteger(durationMs) || durationMs <= 0 || !rate) throw new Error('Playback metadata is invalid.');
    return { durationMs, videoFrameRateNumerator: rate.numerator, videoFrameRateDenominator: rate.denominator };
  } catch {
    throw new AssetStoreError('SERVICE_UNAVAILABLE');
  }
}
async function inspectAssetHandle(
  relativePath: string,
  limits = getEnv()
): Promise<{ inspected: InspectedAsset; handle: FileHandle }> {
  let root: string;
  let valid = false;
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
  let resolvedCandidate: string;
  try {
    resolvedCandidate = await realpath(candidate);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new AssetStoreError('FILE_NOT_FOUND');
    throw new AssetStoreError('SERVICE_UNAVAILABLE');
  }
  const relative = path.relative(root, resolvedCandidate);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
    throw new AssetStoreError('NOT_A_REGULAR_FILE');
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
    valid = true;
    return {
      inspected: {
        relativePath,
        originalName,
        mimeType: (lookup(originalName) || 'application/octet-stream').toLowerCase(),
        sizeBytes: before.size,
        sha256: hash.digest('hex'),
      },
      handle,
    };
  } catch (error) {
    if (error instanceof AssetStoreError) throw error;
    throw new AssetStoreError('SERVICE_UNAVAILABLE');
  } finally {
    if (!valid) await handle.close();
  }
}
export async function inspectAsset(relativePath: string, limits = getEnv()): Promise<InspectedAsset> {
  const { inspected, handle } = await inspectAssetHandle(relativePath, limits);
  await handle.close();
  return inspected;
}
export async function inspectAssetWithPlaybackMetadata(
  relativePath: string,
  limits = getEnv()
): Promise<{ inspected: InspectedAsset; playbackMetadata: PlaybackMetadata | null }> {
  const { inspected, handle } = await inspectAssetHandle(relativePath, limits);
  try {
    return {
      inspected,
      playbackMetadata: playable.has(inspected.mimeType) ? await probePlaybackMetadata(handle) : null,
    };
  } finally {
    await handle.close();
  }
}
