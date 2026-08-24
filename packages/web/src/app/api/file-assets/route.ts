import { randomUUID } from 'node:crypto';
import { registerFileAssetRequestSchema } from '@/features/file-assets/contracts';
import { registerFileAsset } from '@/features/file-assets/service';
import { authenticateApiKey, requireScope } from '@/server/auth/api-key';
import { errorResponse } from '@/server/http/errors';
import { logAssetRegistration } from '@/server/observability/logger';

export const runtime = 'nodejs';
const bodyLimit = 4096;

async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('Missing request body.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.byteLength;
    if (length > bodyLimit) throw new RangeError('Request body exceeds limit.');
    chunks.push(part.value);
  }
  return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
}

export async function POST(request: Request): Promise<Response> {
  const requestId = randomUUID();
  const started = Date.now();
  const respond = (response: Response, outcome: string, principal?: string, assetId?: string, sizeBytes?: number) => {
    logAssetRegistration({ requestId, outcome, principal, assetId, sizeBytes, durationMs: Date.now() - started });
    return response;
  };
  const contentType = request.headers.get('content-type');
  if (!contentType?.toLowerCase().startsWith('application/json'))
    return respond(
      errorResponse('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.', 415, requestId),
      'unsupported_media_type'
    );
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > bodyLimit)
    return respond(
      errorResponse('REQUEST_TOO_LARGE', 'Request body is too large.', 413, requestId),
      'request_too_large'
    );
  let principal;
  try {
    principal = authenticateApiKey(request);
  } catch {
    return respond(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500, requestId), 'server_error');
  }
  if (!principal)
    return respond(
      errorResponse('UNAUTHORIZED', 'Bearer authentication is required.', 401, requestId, undefined, {
        'WWW-Authenticate': 'Bearer',
      }),
      'unauthorized'
    );
  if (!requireScope(principal, 'file-assets:register'))
    return respond(
      errorResponse('FORBIDDEN', 'The principal lacks the required scope.', 403, requestId),
      'forbidden',
      principal.principal
    );
  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    return respond(
      errorResponse(
        error instanceof RangeError ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON',
        error instanceof RangeError ? 'Request body is too large.' : 'Request body is invalid.',
        error instanceof RangeError ? 413 : 400,
        requestId
      ),
      'invalid_body',
      principal.principal
    );
  }
  const parsed = registerFileAssetRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return respond(
      errorResponse('VALIDATION_ERROR', 'Request body is invalid.', 400, requestId, fields),
      'validation_error',
      principal.principal
    );
  }
  try {
    const result = await registerFileAsset(parsed.data, principal.principal);
    if (result.kind === 'created' || result.kind === 'existing')
      return respond(
        Response.json(
          { data: result.record },
          {
            status: result.kind === 'created' ? 201 : 200,
            headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId },
          }
        ),
        result.kind,
        principal.principal,
        result.record.id,
        result.record.sizeBytes
      );
    if (result.kind === 'conflict')
      return respond(
        errorResponse(result.code, 'The asset cannot be registered immutably.', 409, requestId),
        result.code,
        principal.principal
      );
    const statuses = {
      FILE_NOT_FOUND: 404,
      NOT_A_REGULAR_FILE: 422,
      FILE_TOO_LARGE: 413,
      SERVICE_UNAVAILABLE: 503,
    } as const;
    const status = statuses[result.code];
    const headers: HeadersInit = status === 503 ? { 'Retry-After': '5' } : {};
    return respond(
      errorResponse(result.code, 'The requested asset is unavailable.', status, requestId, undefined, headers),
      result.code,
      principal.principal
    );
  } catch {
    return respond(
      errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500, requestId),
      'server_error',
      principal.principal
    );
  }
}
