export type ByteRange = { start: number; end: number };
export function parseByteRange(value: string | null, size: number): ByteRange | 'invalid' | 'unsatisfiable' | null {
  if (!value) return null;
  if (!Number.isSafeInteger(size) || size < 1 || !/^bytes=\d*-\d*$/.test(value)) return 'invalid';
  const [startText, endText] = value.slice(6).split('-');
  if (!startText && !endText) return 'invalid';
  const startNumber = startText ? Number(startText) : undefined;
  const endNumber = endText ? Number(endText) : undefined;
  if (
    (startNumber !== undefined && (!Number.isSafeInteger(startNumber) || startNumber < 0)) ||
    (endNumber !== undefined && (!Number.isSafeInteger(endNumber) || endNumber < 0))
  )
    return 'invalid';
  if (startNumber === undefined) {
    if (!endNumber) return 'invalid';
    return { start: Math.max(0, size - endNumber), end: size - 1 };
  }
  if (startNumber >= size || (endNumber !== undefined && endNumber < startNumber)) return 'unsatisfiable';
  return { start: startNumber, end: Math.min(endNumber ?? size - 1, size - 1) };
}
