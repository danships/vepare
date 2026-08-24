import { createHash } from 'node:crypto';
import { inspectAsset, AssetStoreError } from '@/server/files/asset-store';
import { createFileAsset, DuplicateAssetIdError, getFileAssetById } from './repository';
import type { FileAssetRecord, RegisterFileAssetRequest, RegisterResult } from './types';

const sameImmutable = (record: FileAssetRecord, incoming: Omit<FileAssetRecord, 'id' | 'createdAt'>) =>
  record.relativePath === incoming.relativePath &&
  record.originalName === incoming.originalName &&
  record.mimeType === incoming.mimeType &&
  record.sizeBytes === incoming.sizeBytes &&
  record.sha256 === incoming.sha256 &&
  record.createdBy === incoming.createdBy;

export async function registerFileAsset(input: RegisterFileAssetRequest, principal: string): Promise<RegisterResult> {
  let inspected;
  try {
    inspected = await inspectAsset(input.relativePath);
  } catch (error) {
    if (error instanceof AssetStoreError) {
      if (error.code === 'FILE_CHANGED') return { kind: 'conflict', code: error.code };
      return { kind: 'error', code: error.code };
    }
    throw error;
  }
  const id = createHash('sha256').update(inspected.relativePath, 'utf8').digest('hex').slice(0, 32);
  const candidate = { id, ...inspected, createdBy: principal, createdAt: new Date().toISOString() };
  const existing = await getFileAssetById(id);
  if (existing) {
    if (existing.relativePath !== input.relativePath) return { kind: 'conflict', code: 'ASSET_ID_COLLISION' };
    return sameImmutable(existing, candidate)
      ? { kind: 'existing', record: existing }
      : { kind: 'conflict', code: 'ASSET_ALREADY_REGISTERED' };
  }
  try {
    return { kind: 'created', record: await createFileAsset(candidate) };
  } catch (error) {
    if (error instanceof DuplicateAssetIdError) {
      const winner = await getFileAssetById(id);
      if (!winner) throw error;
      if (winner.relativePath !== input.relativePath) return { kind: 'conflict', code: 'ASSET_ID_COLLISION' };
      return sameImmutable(winner, candidate)
        ? { kind: 'existing', record: winner }
        : { kind: 'conflict', code: 'ASSET_ALREADY_REGISTERED' };
    }
    throw error;
  }
}
