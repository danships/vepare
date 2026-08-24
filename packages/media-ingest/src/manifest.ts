import { createHash } from 'node:crypto';
import { mkdir, open, rename } from 'node:fs/promises';
import path from 'node:path';
import { MediaManifestV1Schema, ReadyMarkerV1Schema, type MediaManifestV1, type ReadyMarkerV1 } from './types.js';

export const canonicalJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
export const sha256Text = (value: string) => createHash('sha256').update(value).digest('hex');
async function atomicWrite(file: string, content: string) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const part = `${file}.part`;
  const handle = await open(part, 'w', 0o600);
  try {
    await handle.writeFile(content, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(part, file);
  const directory = await open(path.dirname(file), 'r');
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}
export async function writeManifestAndMarker(directory: string, manifest: MediaManifestV1, marker: ReadyMarkerV1) {
  const validManifest = MediaManifestV1Schema.parse(manifest);
  const validMarker = ReadyMarkerV1Schema.parse(marker);
  const manifestText = canonicalJson(validManifest);
  await atomicWrite(path.join(directory, 'manifest.json'), manifestText);
  await atomicWrite(path.join(directory, 'ready.json'), canonicalJson(validMarker));
  return { manifestSha256: sha256Text(manifestText), manifestPath: path.join(directory, 'manifest.json') };
}
