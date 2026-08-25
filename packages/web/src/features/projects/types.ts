export type ProjectRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};
export type ProjectResponse = ProjectRecord;
export type ProjectStatus = 'active' | 'archived' | 'all';
