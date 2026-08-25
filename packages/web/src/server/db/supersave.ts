import { SuperSave } from 'supersave';
import type { FileAssetRecord } from '@/features/file-assets/types';
import type { ProjectRecord } from '@/features/projects/types';
import { getEnv } from '@/server/config/env';
import { fileAssetEntity } from './file-asset-entity';
import { projectEntity } from './project-entity';
import { markerEntity } from './marker-entity';
import { clipEntity } from './clip-entity';
import type { MarkerRecord, ClipRecord } from '@/features/annotations/types';

type Database = {
  database: SuperSave;
  fileAssets: Awaited<ReturnType<SuperSave['addEntity']>>;
  projects: Awaited<ReturnType<SuperSave['addEntity']>>;
  markers: Awaited<ReturnType<SuperSave['addEntity']>>;
  clips: Awaited<ReturnType<SuperSave['addEntity']>>;
};
const globalDatabase = globalThis as typeof globalThis & { databasePromise?: Promise<Database> };

export async function getDatabase(): Promise<Database> {
  globalDatabase.databasePromise ??= (async () => {
    const database = await SuperSave.create(getEnv().databaseUrl);
    const fileAssets = await database.addEntity<FileAssetRecord>(fileAssetEntity);
    const projects = await database.addEntity<ProjectRecord>(projectEntity);
    const markers = await database.addEntity<MarkerRecord>(markerEntity);
    const clips = await database.addEntity<ClipRecord>(clipEntity);
    return { database, fileAssets, projects, markers, clips };
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
