import path from 'node:path';
import { SuperSave, type Repository } from 'supersave';
import type Database from 'better-sqlite3';
import { mediaJobEntity, type MediaJob } from './media-job.js';

export async function openState(stateDirectory: string, options: { skipSync?: boolean } = {}) {
  const database = path.resolve(stateDirectory, 'ingest.sqlite');
  if (!path.isAbsolute(database) || /[\0\n\r]/.test(database)) throw new Error('unsafe database path');
  const superSave = await SuperSave.create(`sqlite://${database}`, options);
  const mediaJobs = await superSave.addEntity<MediaJob>(mediaJobEntity);
  const connection = superSave.getConnection<Database.Database>();
  connection.pragma('busy_timeout = 5000');
  connection.pragma('foreign_keys = ON');
  return { superSave, mediaJobs: mediaJobs as Repository<MediaJob>, database };
}
