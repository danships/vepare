export async function readJson(request: Request, limit: number): Promise<unknown> {
  const length = request.headers.get('content-length');
  if (length && Number(length) > limit) throw new RangeError('too large');
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('missing');
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    total += part.value.byteLength;
    if (total > limit) throw new RangeError('too large');
    chunks.push(part.value);
  }
  return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
}
