export async function assignMediaClient(mediaIds: string[], projectId: string | null) {
  const response = await fetch('/api/media/project', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaIds, projectId }),
  });
  if (!response.ok) throw new Error(((await response.json()) as { error: { message: string } }).error.message);
  return response.json();
}
