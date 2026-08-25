import { apiErrorResponseSchema } from '@/features/api/contracts';
import {
  assignmentSchema,
  mediaAssignmentResponseSchema,
  mediaPageResponseSchema,
  type MediaAssignmentRequest,
} from './contracts';

async function readError(response: Response) {
  const body: unknown = await response.json();
  const parsed = apiErrorResponseSchema.safeParse(body);
  return parsed.success ? parsed.data.error.message : 'The server returned an invalid error response.';
}

export async function assignMediaClient(request: MediaAssignmentRequest) {
  const validatedRequest = assignmentSchema.parse(request);
  const response = await fetch('/api/media/project', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validatedRequest),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body: unknown = await response.json();
  return mediaAssignmentResponseSchema.parse(body);
}

export async function getMediaPageClient(url: string, limit: number, offset: number) {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const response = await fetch(`${url}?${query}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(await readError(response));
  const body: unknown = await response.json();
  return mediaPageResponseSchema.parse(body);
}
