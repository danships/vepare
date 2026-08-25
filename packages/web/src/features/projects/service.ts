import { createProject, getProjectById, updateProject } from './repository';
import type { ProjectRecord, ProjectStatus } from './types';

export async function createProjectService(name: string): Promise<ProjectRecord> {
  const now = new Date().toISOString();
  return createProject({ name, createdAt: now, updatedAt: now, archivedAt: null });
}
export async function renameProject(id: string, name: string): Promise<ProjectRecord | 'not_found' | 'archived'> {
  const project = await getProjectById(id);
  if (!project) return 'not_found';
  if (project.archivedAt) return 'archived';
  return updateProject({ ...project, name, updatedAt: new Date().toISOString() });
}
export async function archiveProject(id: string): Promise<'not_found' | ProjectRecord> {
  const project = await getProjectById(id);
  if (!project) return 'not_found';
  if (project.archivedAt) return project;
  const now = new Date().toISOString();
  return updateProject({ ...project, archivedAt: now, updatedAt: now });
}

export { listProjects, getProjectById } from './repository';
