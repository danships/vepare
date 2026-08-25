import { randomUUID } from 'node:crypto';
import { projectBodySchema, projectStatusSchema } from '@/features/projects/contracts';
import { createProjectService, listProjects } from '@/features/projects/service';
import { requireBrowserApiSession, requireSameOrigin } from '@/server/auth/browser-api';
import { errorResponse } from '@/server/http/errors';
import { readJson } from '@/server/http/request';
export const runtime = 'nodejs';
const headers = (id: string) => ({ 'Cache-Control': 'no-store', 'X-Request-ID': id });
export async function GET(request: Request) {
  const id = randomUUID();
  const auth = await requireBrowserApiSession(request, id);
  if (auth) return auth;
  const parsed = projectStatusSchema.safeParse(new URL(request.url).searchParams.get('status') ?? undefined);
  if (!parsed.success) return errorResponse('VALIDATION_ERROR', 'Query is invalid.', 400, id);
  try {
    return Response.json({ data: await listProjects(parsed.data) }, { headers: headers(id) });
  } catch {
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500, id);
  }
}
export async function POST(request: Request) {
  const id = randomUUID();
  const auth = await requireBrowserApiSession(request, id);
  if (auth) return auth;
  const origin = requireSameOrigin(request, id);
  if (origin) return origin;
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return errorResponse('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.', 415, id);
  try {
    const body = projectBodySchema.safeParse(await readJson(request, 4096));
    if (!body.success)
      return errorResponse(
        'VALIDATION_ERROR',
        'Request body is invalid.',
        400,
        id,
        body.error.flatten().fieldErrors as Record<string, string[]>
      );
    return Response.json({ data: await createProjectService(body.data.name) }, { status: 201, headers: headers(id) });
  } catch (error) {
    return errorResponse(
      error instanceof RangeError ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON',
      'Request body is invalid.',
      error instanceof RangeError ? 413 : 400,
      id
    );
  }
}
