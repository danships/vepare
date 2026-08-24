import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { SUPPORTED_SOURCE_EXTENSIONS } from './types.js';

export const isSupportedCandidate = (file: string) =>
  !path.basename(file).startsWith('.') &&
  !/\.(part|tmp)$/i.test(file) &&
  SUPPORTED_SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase());
export async function candidate(root: string, file: string) {
  if (!isSupportedCandidate(file)) return null;
  const [realRoot, realFile, info] = await Promise.all([
    realpath(root),
    realpath(file).catch(() => ''),
    stat(file).catch(() => null),
  ]);
  if (!info?.isFile() || !realFile.startsWith(`${realRoot}${path.sep}`)) return null;
  return {
    sourcePath: realFile,
    sourceRelativePath: path.relative(realRoot, realFile).split(path.sep).join('/'),
    size: info.size,
    mtimeMs: info.mtimeMs,
  };
}
export async function scan(root: string, recursive: boolean, onFile: (file: string) => Promise<void>) {
  const directory = await (await import('node:fs/promises')).opendir(root);
  for await (const entry of directory) {
    const full = path.join(root, entry.name);
    if (entry.isFile()) await onFile(full);
    else if (recursive && entry.isDirectory() && !entry.isSymbolicLink()) await scan(full, recursive, onFile);
  }
}
export function watch(root: string, recursive: boolean, onFile: (file: string) => void): FSWatcher {
  const watcher = chokidar.watch(root, {
    ignoreInitial: true,
    persistent: true,
    depth: recursive ? undefined : 0,
    awaitWriteFinish: false,
    followSymlinks: false,
  });
  watcher.on('add', onFile).on('change', onFile);
  return watcher;
}
