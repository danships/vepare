import { randomUUID } from 'node:crypto';
import { paginationSchema } from '@/features/media/contracts';
import { getInboxMedia } from '@/features/media/service';
import { requireBrowserApiSession } from '@/server/auth/browser-api';
import { errorResponse } from '@/server/http/errors';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const id = randomUUID();
  const auth = await requireBrowserApiSession(request, id);
  if (auth) return auth;
  const query = paginationSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return errorResponse('VALIDATION_ERROR', 'Query is invalid.', 400, id);
  try {
    return Response.json(await getInboxMedia(query.data.limit, query.data.offset), {
      headers: { 'Cache-Control': 'no-store', 'X-Request-ID': id },
    });
  } catch {
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500, id);
  }
}
