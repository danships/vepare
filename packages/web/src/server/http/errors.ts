import type { ErrorResponse } from '@/features/file-assets/types';
export function errorResponse(
  code: string,
  message: string,
  status: number,
  requestId: string,
  fields?: Record<string, string[]>,
  extra: HeadersInit = {}
): Response {
  const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Request-ID': requestId, ...extra });
  const error: ErrorResponse['error'] = { code, message };
  if (fields) error.fields = fields;
  return Response.json({ error }, { status, headers });
}
