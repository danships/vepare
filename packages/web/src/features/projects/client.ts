import { apiErrorResponseSchema } from '@/features/api/contracts';
import { projectBodySchema, projectIdSchema, projectResponseSchema, type ProjectRequest } from './contracts';

async function readError(response: Response) {
  const body: unknown = await response.json();
  const parsed = apiErrorResponseSchema.safeParse(body);
  return parsed.success ? parsed.data.error.message : 'The server returned an invalid error response.';
}

export async function createProjectClient(request: ProjectRequest) {
  const validatedRequest = projectBodySchema.parse(request);
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validatedRequest),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body: unknown = await response.json();
  return projectResponseSchema.parse(body);
}
export async function archiveProjectClient(id: string) {
  const projectId = projectIdSchema.parse(id);
  const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(await readError(response));
}
