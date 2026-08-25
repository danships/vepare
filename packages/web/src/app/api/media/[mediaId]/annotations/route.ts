import { randomUUID } from 'node:crypto';
import { annotations } from '@/features/annotations/service';
import { routeIdSchema } from '@/features/annotations/contracts';
import { requireBrowserApiSession } from '@/server/auth/browser-api';
import { errorResponse } from '@/server/http/errors';
export const runtime = 'nodejs';
export async function GET(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const requestId = randomUUID();
  const auth = await requireBrowserApiSession(request, requestId);
  if (auth) return auth;
  const routeParameters = await params;
  const mediaId = routeIdSchema.safeParse(routeParameters.mediaId);
  if (!mediaId.success) return errorResponse('VALIDATION_ERROR', 'Request is invalid.', 400, requestId);
  const data = await annotations(mediaId.data);
  return data
    ? Response.json({ data }, { headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId } })
    : errorResponse('MEDIA_NOT_FOUND', 'Media was not found.', 404, requestId);
}
