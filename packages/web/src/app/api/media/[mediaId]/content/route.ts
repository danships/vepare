import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { getFileAssetById } from '@/features/file-assets/repository';
import { routeIdSchema } from '@/features/annotations/contracts';
import { requireBrowserApiSession } from '@/server/auth/browser-api';
import { openRegisteredAsset, AssetStoreError } from '@/server/files/asset-store';
import { parseByteRange } from '@/server/http/byte-range';
import { errorResponse } from '@/server/http/errors';
export const runtime = 'nodejs';
const playable = new Set(['video/mp4', 'video/webm']);
async function serve(request: Request, parameters: Promise<{ mediaId: string }>, head: boolean) {
  const requestId = randomUUID();
  const auth = await requireBrowserApiSession(request, requestId);
  if (auth) return auth;
  const routeParameters = await parameters;
  const parsed = routeIdSchema.safeParse(routeParameters.mediaId);
  if (!parsed.success) return errorResponse('MEDIA_NOT_FOUND', 'Media was not found.', 404, requestId);
  const media = await getFileAssetById(parsed.data);
  if (!media) return errorResponse('MEDIA_NOT_FOUND', 'Media was not found.', 404, requestId);
  if (!playable.has(media.mimeType) || !media.durationMs)
    return errorResponse('MEDIA_NOT_PLAYABLE', 'Media is not playable.', 422, requestId);
  const range = parseByteRange(request.headers.get('range'), media.sizeBytes);
  if (range === 'invalid') return errorResponse('INVALID_RANGE', 'Range is invalid.', 400, requestId);
  if (range === 'unsatisfiable')
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${media.sizeBytes}`, 'X-Request-ID': requestId },
    });
  const selected = range ?? { start: 0, end: media.sizeBytes - 1 };
  const headers = new Headers({
    'Content-Type': media.mimeType,
    'Content-Length': String(selected.end - selected.start + 1),
    'Accept-Ranges': 'bytes',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
    'X-Request-ID': requestId,
  });
  if (range) headers.set('Content-Range', `bytes ${selected.start}-${selected.end}/${media.sizeBytes}`);
  try {
    const handle = await openRegisteredAsset(media);
    if (head) {
      await handle.close();
      return new Response(null, { status: range ? 206 : 200, headers });
    }
    const stream = createReadStream('', { fd: handle.fd, autoClose: true, start: selected.start, end: selected.end });
    return new Response(Readable.toWeb(stream) as ReadableStream, { status: range ? 206 : 200, headers });
  } catch (error) {
    return error instanceof AssetStoreError
      ? errorResponse('MEDIA_UNAVAILABLE', 'Media is unavailable.', 503, requestId)
      : errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500, requestId);
  }
}
export async function GET(request: Request, context: { params: Promise<{ mediaId: string }> }) {
  return serve(request, context.params, false);
}
export async function HEAD(request: Request, context: { params: Promise<{ mediaId: string }> }) {
  return serve(request, context.params, true);
}
