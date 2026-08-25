import { randomUUID } from 'node:crypto';
import { clipBodySchema, routeIdSchema } from '@/features/annotations/contracts';
import { deleteAnnotation, saveClip } from '@/features/annotations/service';
import { requireBrowserApiSession, requireSameOrigin } from '@/server/auth/browser-api';
import { errorResponse } from '@/server/http/errors';
import { readJson } from '@/server/http/request';
export const runtime = 'nodejs';
async function ids(parameters: Promise<{ mediaId: string; clipId: string }>) {
  const value = await parameters;
  return [routeIdSchema.safeParse(value.mediaId), routeIdSchema.safeParse(value.clipId)] as const;
}
export async function PATCH(request: Request, { params }: { params: Promise<{ mediaId: string; clipId: string }> }) {
  const requestId = randomUUID();
  const auth = await requireBrowserApiSession(request, requestId);
  if (auth) return auth;
  const origin = requireSameOrigin(request, requestId);
  if (origin) return origin;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return errorResponse('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.', 415, requestId);
  try {
    const [mediaId, clipId] = await ids(params);
    const body = clipBodySchema.safeParse(await readJson(request, 1024));
    if (!mediaId.success || !clipId.success || !body.success)
      return errorResponse('VALIDATION_ERROR', 'Request body is invalid.', 400, requestId);
    const result = await saveClip(mediaId.data, body.data.inMs, body.data.outMs, clipId.data);
    if (result.kind === 'ok')
      return Response.json(
        { data: result.record },
        { headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId } }
      );
    let failure: [string, number] = ['CLIP_NOT_FOUND', 404];
    if (result.kind === 'out_of_bounds') failure = ['RANGE_OUT_OF_BOUNDS', 422];
    if (result.kind === 'inactive') failure = ['MEDIA_NOT_IN_ACTIVE_PROJECT', 409];
    return errorResponse(failure[0], 'Clip could not be updated.', failure[1], requestId);
  } catch (error) {
    return errorResponse(
      error instanceof RangeError ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON',
      error instanceof RangeError ? 'Request body is too large.' : 'Request body is invalid.',
      error instanceof RangeError ? 413 : 400,
      requestId
    );
  }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ mediaId: string; clipId: string }> }) {
  const requestId = randomUUID();
  const auth = await requireBrowserApiSession(request, requestId);
  if (auth) return auth;
  const origin = requireSameOrigin(request, requestId);
  if (origin) return origin;
  const [mediaId, clipId] = await ids(params);
  if (!mediaId.success || !clipId.success)
    return errorResponse('CLIP_NOT_FOUND', 'Clip was not found.', 404, requestId);
  const result = await deleteAnnotation(mediaId.data, clipId.data, 'clip');
  return result.kind === 'ok'
    ? new Response(null, { status: 204, headers: { 'X-Request-ID': requestId } })
    : errorResponse('CLIP_NOT_FOUND', 'Clip was not found.', 404, requestId);
}
