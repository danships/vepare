import { SuperSave } from 'supersave';
import type { FileAssetRecord } from '@/features/file-assets/types';
import type { ProjectRecord } from '@/features/projects/types';
import { getEnv } from '@/server/config/env';
import { fileAssetEntity } from './file-asset-entity';
import { projectEntity } from './project-entity';

type Database = {
  database: SuperSave;
  fileAssets: Awaited<ReturnType<SuperSave['addEntity']>>;
  projects: Awaited<ReturnType<SuperSave['addEntity']>>;
};
const globalDatabase = globalThis as typeof globalThis & { databasePromise?: Promise<Database> };

export async function getDatabase(): Promise<Database> {
  globalDatabase.databasePromise ??= (async () => {
    const database = await SuperSave.create(getEnv().databaseUrl);
    const fileAssets = await database.addEntity<FileAssetRecord>(fileAssetEntity);
    const projects = await database.addEntity<ProjectRecord>(projectEntity);
    return { database, fileAssets, projects };
  })();
  try {
    return await globalDatabase.databasePromise;
  } catch (error) {
    delete globalDatabase.databasePromise;
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (globalDatabase.databasePromise) {
    const database = await globalDatabase.databasePromise;
    await database.database.close();
  }
  delete globalDatabase.databasePromise;
}

// Compatibility for existing registration tests and callers.
export const getFileAssetDatabase = getDatabase;
export const closeFileAssetDatabase = closeDatabase;
