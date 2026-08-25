import type { EntityDefinition } from 'supersave';

export const fileAssetEntity: EntityDefinition = {
  name: 'file-asset',
  template: {
    relativePath: '',
    originalName: '',
    mimeType: '',
    sizeBytes: 0,
    sha256: '',
    createdBy: '',
    createdAt: '',
    projectId: null,
    durationMs: null,
    videoFrameRateNumerator: null,
    videoFrameRateDenominator: null,
  },
  relations: [],
  filterSortFields: { projectId: 'string', createdAt: 'string', durationMs: 'number' },
};
