import { randomUUID } from 'node:crypto';
import { assignmentSchema } from '@/features/media/contracts';
import { assignMedia } from '@/features/media/service';
import { requireBrowserApiSession, requireSameOrigin } from '@/server/auth/browser-api';
import { errorResponse } from '@/server/http/errors';
import { readJson } from '@/server/http/request';
export const runtime = 'nodejs';
export async function PATCH(request: Request) {
  const id = randomUUID();
  const auth = await requireBrowserApiSession(request, id);
  if (auth) return auth;
  const origin = requireSameOrigin(request, id);
  if (origin) return origin;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return errorResponse('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.', 415, id);
  try {
    const body = assignmentSchema.safeParse(await readJson(request, 16 * 1024));
    if (!body.success) return errorResponse('VALIDATION_ERROR', 'Request body is invalid.', 400, id);
    const result = await assignMedia(body.data.mediaIds, body.data.projectId);
    if (typeof result === 'string') {
      const map = {
        media_not_found: ['MEDIA_NOT_FOUND', 404],
        project_not_found: ['PROJECT_NOT_FOUND', 404],
        project_archived: ['PROJECT_ARCHIVED', 409],
      } as const;
      const [code, status] = map[result];
      return errorResponse(code, 'Assignment could not be completed.', status, id);
    }
    return Response.json(
      { data: { mediaIds: body.data.mediaIds, projectId: body.data.projectId, changedCount: result.changedCount } },
      { headers: { 'Cache-Control': 'no-store', 'X-Request-ID': id } }
    );
  } catch (error) {
    return errorResponse(
      error instanceof RangeError ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON',
      'Request body is invalid.',
      error instanceof RangeError ? 413 : 400,
      id
    );
  }
}
