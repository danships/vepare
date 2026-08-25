import type { EntityDefinition } from 'supersave';

export const clipEntity: EntityDefinition = {
  name: 'clip',
  template: { mediaId: '', inMs: 0, outMs: 1, createdAt: '', updatedAt: '', deletedAt: null },
  relations: [],
  filterSortFields: { mediaId: 'string', inMs: 'number', outMs: 'number', deletedAt: 'string', createdAt: 'string' },
};
