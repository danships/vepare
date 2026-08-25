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
    let failure: [string, number] = ['MARKER_NOT_FOUND', 404];
    if (result.kind === 'out_of_bounds') failure = ['TIMESTAMP_OUT_OF_BOUNDS', 422];
    if (result.kind === 'inactive') failure = ['MEDIA_NOT_IN_ACTIVE_PROJECT', 409];
    return errorResponse(failure[0], 'Marker could not be updated.', failure[1], requestId);
  } catch (error) {
    return errorResponse(
      error instanceof RangeError ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON',
      error instanceof RangeError ? 'Request body is too large.' : 'Request body is invalid.',
      error instanceof RangeError ? 413 : 400,
      requestId
    );
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
