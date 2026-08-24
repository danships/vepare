import { SuperSave } from 'supersave';
import type { FileAssetRecord } from '@/features/file-assets/types';
import { getEnv } from '@/server/config/env';
import { fileAssetEntity } from './file-asset-entity';

type Database = { database: SuperSave; repository: Awaited<ReturnType<SuperSave['addEntity']>> };
const globalDatabase = globalThis as typeof globalThis & { fileAssetDatabase?: Promise<Database> };

export async function getFileAssetDatabase(): Promise<Database> {
  globalDatabase.fileAssetDatabase ??= (async () => {
    const database = await SuperSave.create(getEnv().databaseUrl);
    const repository = await database.addEntity<FileAssetRecord>(fileAssetEntity);
    return { database, repository };
  })();
  try {
    return await globalDatabase.fileAssetDatabase;
  } catch (error) {
    delete globalDatabase.fileAssetDatabase;
    throw error;
  }
}

export async function closeFileAssetDatabase(): Promise<void> {
  if (globalDatabase.fileAssetDatabase) {
    const database = await globalDatabase.fileAssetDatabase;
    await database.database.close();
  }
  delete globalDatabase.fileAssetDatabase;
}
