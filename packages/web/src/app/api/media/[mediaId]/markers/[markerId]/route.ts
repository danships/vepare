import { randomUUID } from 'node:crypto';
import { markerUpdateSchema, routeIdSchema } from '@/features/annotations/contracts';
import { deleteAnnotation, saveMarker } from '@/features/annotations/service';
import { requireBrowserApiSession, requireSameOrigin } from '@/server/auth/browser-api';
import { errorResponse } from '@/server/http/errors';
import { readJson } from '@/server/http/request';
export const runtime = 'nodejs';
async function ids(parameters: Promise<{ mediaId: string; markerId: string }>) {
  const value = await parameters;
  return [routeIdSchema.safeParse(value.mediaId), routeIdSchema.safeParse(value.markerId)] as const;
}
export async function PATCH(request: Request, { params }: { params: Promise<{ mediaId: string; markerId: string }> }) {
  const requestId = randomUUID();
  const auth = await requireBrowserApiSession(request, requestId);
  if (auth) return auth;
  const origin = requireSameOrigin(request, requestId);
  if (origin) return origin;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return errorResponse('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.', 415, requestId);
  try {
    const [mediaId, markerId] = await ids(params);
    const body = markerUpdateSchema.safeParse(await readJson(request, 4096));
    if (!mediaId.success || !markerId.success || !body.success)
      return errorResponse('VALIDATION_ERROR', 'Request body is invalid.', 400, requestId);
    const result = await saveMarker(mediaId.data, body.data.timestampMs, body.data.note, markerId.data);
    if (result.kind === 'ok')
      return Response.json(
        { data: result.record },
        { headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId } }
      );
    return errorResponse(
      result.kind === 'out_of_bounds' ? 'TIMESTAMP_OUT_OF_BOUNDS' : 'MARKER_NOT_FOUND',
      'Marker could not be updated.',
      result.kind === 'out_of_bounds' ? 422 : 404,
      requestId
    );
  } catch {
    return errorResponse('INVALID_JSON', 'Request body is invalid.', 400, requestId);
  }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ mediaId: string; markerId: string }> }) {
  const requestId = randomUUID();
  const auth = await requireBrowserApiSession(request, requestId);
  if (auth) return auth;
  const origin = requireSameOrigin(request, requestId);
  if (origin) return origin;
  const [mediaId, markerId] = await ids(params);
  if (!mediaId.success || !markerId.success)
    return errorResponse('MARKER_NOT_FOUND', 'Marker was not found.', 404, requestId);
  const result = await deleteAnnotation(mediaId.data, markerId.data, 'marker');
  return result.kind === 'ok'
    ? new Response(null, { status: 204, headers: { 'X-Request-ID': requestId } })
    : errorResponse('MARKER_NOT_FOUND', 'Marker was not found.', 404, requestId);
}
