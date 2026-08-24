import { timingSafeEqual } from 'node:crypto';
import { getEnv } from '@/server/config/env';

export type AuthenticatedPrincipal = { principal: string; scopes: string[] };
export function authenticateApiKey(request: Request): AuthenticatedPrincipal | null {
  const header = request.headers.get('authorization');
  const match = header?.match(/^Bearer ([^\s]+)$/);
  if (!match) return null;
  const received = Buffer.from(match[1]);
  for (const item of getEnv().apiKeys) {
    const expected = Buffer.from(item.key);
    if (expected.length === received.length && timingSafeEqual(expected, received))
      return { principal: item.principal, scopes: item.scopes };
  }
  return null;
}
export const requireScope = (principal: AuthenticatedPrincipal, scope: 'file-assets:register') =>
  principal.scopes.includes(scope);
