import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_MESSAGE = 'psk-session:v1';

export function createSessionToken(presharedKey: string): string {
  return createHmac('sha256', presharedKey).update(SESSION_MESSAGE, 'utf8').digest('hex');
}

export function matchesSecret(candidate: string, expected: string): boolean {
  const candidateBytes = Buffer.from(candidate, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');

  return candidateBytes.byteLength === expectedBytes.byteLength && timingSafeEqual(candidateBytes, expectedBytes);
}
