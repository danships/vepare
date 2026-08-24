import { z } from 'zod';
import { getFileAssetDatabase } from '@/server/db/supersave';
import type { FileAssetRecord } from './types';

const recordSchema = z
  .object({
    id: z.string().length(32),
    relativePath: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    createdBy: z.string(),
    createdAt: z.string().datetime(),
  })
  .strict();
export class DuplicateAssetIdError extends Error {}

export async function getFileAssetById(id: string): Promise<FileAssetRecord | null> {
  const database = await getFileAssetDatabase();
  const record = await database.repository.getById(id);
  return record === null ? null : recordSchema.parse(record);
}
export async function createFileAsset(record: FileAssetRecord): Promise<FileAssetRecord> {
  try {
    const database = await getFileAssetDatabase();
    const repository = database.repository as { create: (value: FileAssetRecord) => Promise<unknown> };
    return recordSchema.parse(await repository.create(record));
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('unique') || message.includes('duplicate') || message.includes('primary key'))
      throw new DuplicateAssetIdError();
    throw error;
  }
}
