import { z } from 'zod';
import { getDatabase } from '@/server/db/supersave';
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
    projectId: z.string().nullable().default(null),
    durationMs: z.number().int().nonnegative().nullable().default(null),
    videoFrameRateNumerator: z.number().int().positive().nullable().default(null),
    videoFrameRateDenominator: z.number().int().positive().nullable().default(null),
  })
  .strict();
export class DuplicateAssetIdError extends Error {}

export async function getFileAssetById(id: string): Promise<FileAssetRecord | null> {
  const database = await getDatabase();
  const record = await database.fileAssets.getById(id);
  return record === null ? null : recordSchema.parse(record);
}
export async function createFileAsset(record: FileAssetRecord): Promise<FileAssetRecord> {
  try {
    const database = await getDatabase();
    const repository = database.fileAssets as { create: (value: FileAssetRecord) => Promise<unknown> };
    return recordSchema.parse(await repository.create(record));
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('unique') || message.includes('duplicate') || message.includes('primary key'))
      throw new DuplicateAssetIdError();
    throw error;
  }
}

type Page = { limit: number; offset: number };
export async function listInbox({ limit, offset }: Page): Promise<FileAssetRecord[]> {
  const { fileAssets } = await getDatabase();
  const query = fileAssets
    .createQuery()
    .eq('projectId', null)
    .sort('createdAt', 'desc')
    .sort('id', 'asc')
    .limit(limit)
    .offset(offset);
  return recordSchema.array().parse(await fileAssets.getByQuery(query));
}
export async function listByProject(projectId: string, { limit, offset }: Page): Promise<FileAssetRecord[]> {
  const { fileAssets } = await getDatabase();
  const query = fileAssets
    .createQuery()
    .eq('projectId', projectId)
    .sort('createdAt', 'desc')
    .sort('id', 'asc')
    .limit(limit)
    .offset(offset);
  return recordSchema.array().parse(await fileAssets.getByQuery(query));
}
export async function bulkSetProjectId(mediaIds: string[], projectId: string | null): Promise<number> {
  const { fileAssets } = await getDatabase();
  const records = recordSchema.array().parse(await fileAssets.getByIds(mediaIds));
  if (records.length !== mediaIds.length) throw new Error('MEDIA_NOT_FOUND');
  const changed = records.filter((record) => record.projectId !== projectId);
  await Promise.all(changed.map((record) => fileAssets.update({ ...record, projectId })));
  return changed.length;
}
