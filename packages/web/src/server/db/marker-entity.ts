import type { EntityDefinition } from 'supersave';

export const markerEntity: EntityDefinition = {
  name: 'marker',
  template: { mediaId: '', timestampMs: 0, note: null, createdAt: '', updatedAt: '', deletedAt: null },
  relations: [],
  filterSortFields: { mediaId: 'string', timestampMs: 'number', deletedAt: 'string', createdAt: 'string' },
};
