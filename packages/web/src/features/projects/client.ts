export async function createProjectClient(name: string) {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error(((await response.json()) as { error: { message: string } }).error.message);
  return response.json();
}
export async function archiveProjectClient(id: string) {
  const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(((await response.json()) as { error: { message: string } }).error.message);
}
