export type MarkerRecord = {
  id: string;
  mediaId: string;
  timestampMs: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
export type ClipRecord = {
  id: string;
  mediaId: string;
  inMs: number;
  outMs: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
export type MarkerResponse = Omit<MarkerRecord, 'deletedAt'>;
export type ClipResponse = Omit<ClipRecord, 'deletedAt'>;
