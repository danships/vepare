import { isAuthenticated } from '@/lib/auth';
import { errorResponse } from '@/server/http/errors';
export async function requireBrowserApiSession(request: Request, requestId: string): Promise<Response | null> {
  return (await isAuthenticated())
    ? null
    : errorResponse('UNAUTHORIZED', 'Authentication is required.', 401, requestId);
}
export function requireSameOrigin(request: Request, requestId: string): Response | null {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin)
    return errorResponse('FORBIDDEN', 'Cross-origin requests are not allowed.', 403, requestId);
  return null;
}
