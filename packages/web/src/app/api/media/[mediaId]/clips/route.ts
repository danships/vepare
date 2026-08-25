import { randomUUID } from 'node:crypto';
import { clipBodySchema, routeIdSchema } from '@/features/annotations/contracts';
import { saveClip } from '@/features/annotations/service';
import { requireBrowserApiSession, requireSameOrigin } from '@/server/auth/browser-api';
import { errorResponse } from '@/server/http/errors';
import { readJson } from '@/server/http/request';
export const runtime = 'nodejs';
export async function POST(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const requestId = randomUUID();
  const auth = await requireBrowserApiSession(request, requestId);
  if (auth) return auth;
  const origin = requireSameOrigin(request, requestId);
  if (origin) return origin;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return errorResponse('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.', 415, requestId);
  try {
    const routeParameters = await params;
    const id = routeIdSchema.safeParse(routeParameters.mediaId);
    const body = clipBodySchema.safeParse(await readJson(request, 1024));
    if (!id.success || !body.success)
      return errorResponse('VALIDATION_ERROR', 'Request body is invalid.', 400, requestId);
    const result = await saveClip(id.data, body.data.inMs, body.data.outMs);
    if (result.kind === 'ok')
      return Response.json(
        { data: result.record },
        { status: 201, headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId } }
      );
    let failure: [string, number] = ['MEDIA_NOT_FOUND', 404];
    if (result.kind === 'out_of_bounds') failure = ['RANGE_OUT_OF_BOUNDS', 422];
    if (result.kind === 'inactive') failure = ['MEDIA_NOT_IN_ACTIVE_PROJECT', 409];
    return errorResponse(failure[0], 'Clip could not be created.', failure[1], requestId);
  } catch (error) {
    return errorResponse(
      error instanceof RangeError ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON',
      'Request body is invalid.',
      error instanceof RangeError ? 413 : 400,
      requestId
    );
  }
}
