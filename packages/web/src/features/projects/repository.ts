import { z } from 'zod';
import { getDatabase } from '@/server/db/supersave';
import type { ProjectRecord, ProjectStatus } from './types';

const schema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    archivedAt: z.string().datetime().nullable(),
  })
  .strict();
export async function getProjectById(id: string): Promise<ProjectRecord | null> {
  const { projects } = await getDatabase();
  const result = await projects.getById(id);
  return result ? schema.parse(result) : null;
}
export async function createProject(record: Omit<ProjectRecord, 'id'>): Promise<ProjectRecord> {
  const { projects } = await getDatabase();
  return schema.parse(await projects.create(record));
}
export async function updateProject(record: ProjectRecord): Promise<ProjectRecord> {
  const { projects } = await getDatabase();
  return schema.parse(await projects.update(record));
}
export async function listProjects(status: ProjectStatus): Promise<ProjectRecord[]> {
  const { projects } = await getDatabase();
  const all = schema.array().parse(await projects.getAll());
  return all
    .filter((item) => status === 'all' || (status === 'active' ? item.archivedAt === null : item.archivedAt !== null))
    .toSorted(
      (a, b) => Number(a.archivedAt !== null) - Number(b.archivedAt !== null) || b.updatedAt.localeCompare(a.updatedAt)
    );
}
