import { randomUUID } from 'node:crypto';
import { paginationSchema } from '@/features/media/contracts';
import { getProjectMedia } from '@/features/media/service';
import { projectIdSchema } from '@/features/projects/contracts';
import { requireBrowserApiSession } from '@/server/auth/browser-api';
import { errorResponse } from '@/server/http/errors';
export const runtime = 'nodejs';
type Context = { params: Promise<{ projectId: string }> };
export async function GET(request: Request, context: Context) {
  const id = randomUUID();
  const auth = await requireBrowserApiSession(request, id);
  if (auth) return auth;
  const routeParameters = await context.params;
  const projectId = projectIdSchema.safeParse(routeParameters.projectId);
  const query = paginationSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!projectId.success || !query.success) return errorResponse('VALIDATION_ERROR', 'Request is invalid.', 400, id);
  try {
    const result = await getProjectMedia(projectId.data, query.data.limit, query.data.offset);
    return result === 'not_found'
      ? errorResponse('PROJECT_NOT_FOUND', 'Project was not found.', 404, id)
      : Response.json(result, { headers: { 'Cache-Control': 'no-store', 'X-Request-ID': id } });
  } catch {
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500, id);
  }
}
