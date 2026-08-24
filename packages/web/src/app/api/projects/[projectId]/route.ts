import { randomUUID } from 'node:crypto';
import { projectBodySchema, projectIdSchema } from '@/features/projects/contracts';
import { archiveProject, getProjectById, renameProject } from '@/features/projects/service';
import { requireBrowserApiSession, requireSameOrigin } from '@/server/auth/browser-api';
import { errorResponse } from '@/server/http/errors';
import { readJson } from '@/server/http/request';
export const runtime = 'nodejs';
const headers = (id: string) => ({ 'Cache-Control': 'no-store', 'X-Request-ID': id });
type Context = { params: Promise<{ projectId: string }> };
async function valid(context: Context, id: string) {
  const routeParameters = await context.params;
  const result = projectIdSchema.safeParse(routeParameters.projectId);
  return result.success ? result.data : errorResponse('VALIDATION_ERROR', 'Project ID is invalid.', 400, id);
}
export async function GET(request: Request, context: Context) {
  const id = randomUUID();
  const auth = await requireBrowserApiSession(request, id);
  if (auth) return auth;
  const projectId = await valid(context, id);
  if (projectId instanceof Response) return projectId;
  try {
    const project = await getProjectById(projectId);
    return project
      ? Response.json({ data: project }, { headers: headers(id) })
      : errorResponse('PROJECT_NOT_FOUND', 'Project was not found.', 404, id);
  } catch {
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500, id);
  }
}
export async function PATCH(request: Request, context: Context) {
  const id = randomUUID();
  const auth = await requireBrowserApiSession(request, id);
  if (auth) return auth;
  const origin = requireSameOrigin(request, id);
  if (origin) return origin;
  const projectId = await valid(context, id);
  if (projectId instanceof Response) return projectId;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return errorResponse('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.', 415, id);
  try {
    const body = projectBodySchema.safeParse(await readJson(request, 4096));
    if (!body.success) return errorResponse('VALIDATION_ERROR', 'Request body is invalid.', 400, id);
    const result = await renameProject(projectId, body.data.name);
    if (result === 'not_found') return errorResponse('PROJECT_NOT_FOUND', 'Project was not found.', 404, id);
    if (result === 'archived') return errorResponse('PROJECT_ARCHIVED', 'Archived projects are immutable.', 409, id);
    return Response.json({ data: result }, { headers: headers(id) });
  } catch {
    return errorResponse('INVALID_JSON', 'Request body is invalid.', 400, id);
  }
}
export async function DELETE(request: Request, context: Context) {
  const id = randomUUID();
  const auth = await requireBrowserApiSession(request, id);
  if (auth) return auth;
  const origin = requireSameOrigin(request, id);
  if (origin) return origin;
  const projectId = await valid(context, id);
  if (projectId instanceof Response) return projectId;
  try {
    const result = await archiveProject(projectId);
    return result === 'not_found'
      ? errorResponse('PROJECT_NOT_FOUND', 'Project was not found.', 404, id)
      : new Response(null, { status: 204, headers: headers(id) });
  } catch {
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500, id);
  }
}
