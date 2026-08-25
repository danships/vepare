import type { EntityDefinition } from 'supersave';

export const projectEntity: EntityDefinition = {
  name: 'project',
  template: { name: '', createdAt: '', updatedAt: '', archivedAt: null },
  relations: [],
  filterSortFields: { name: 'string', createdAt: 'string', updatedAt: 'string', archivedAt: 'string' },
};
