import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

export type Fingerprint = { size: number; mtimeMs: number };
export async function sha256File(file: string, fingerprint?: Fingerprint): Promise<string | null> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer);
  const after = await stat(file);
  if (fingerprint && (after.size !== fingerprint.size || after.mtimeMs !== fingerprint.mtimeMs)) return null;
  return hash.digest('hex');
}
