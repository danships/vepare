export type FileAssetRecord = {
  id: string;
  relativePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  createdBy: string;
  createdAt: string;
};

export type RegisterFileAssetRequest = Pick<FileAssetRecord, 'relativePath'>;
export type FileAssetResponse = { data: FileAssetRecord };
export type ErrorResponse = { error: { code: string; message: string; fields?: Record<string, string[]> } };

export type RegisterResult =
  | { kind: 'created'; record: FileAssetRecord }
  | { kind: 'existing'; record: FileAssetRecord }
  | { kind: 'conflict'; code: 'ASSET_ALREADY_REGISTERED' | 'ASSET_ID_COLLISION' | 'FILE_CHANGED' }
  | { kind: 'error'; code: 'FILE_NOT_FOUND' | 'NOT_A_REGULAR_FILE' | 'FILE_TOO_LARGE' | 'SERVICE_UNAVAILABLE' };
