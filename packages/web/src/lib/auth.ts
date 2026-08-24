import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createSessionToken, matchesSecret } from './auth-crypto';

export const AUTH_COOKIE_NAME = 'psk_session';
export const AUTH_COOKIE_MAX_AGE_SECONDS = 28_800;

export class AuthConfigurationError extends Error {
  constructor() {
    super('Authentication is not configured correctly.');
    this.name = 'AuthConfigurationError';
  }
}

export function getConfiguredPresharedKey(): string {
  const presharedKey = process.env.AUTH_PRESHARED_KEY;

  if (
    typeof presharedKey !== 'string' ||
    presharedKey.trim().length === 0 ||
    presharedKey.length < 32 ||
    presharedKey.length > 1024
  ) {
    throw new AuthConfigurationError();
  }

  return presharedKey;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (typeof sessionToken !== 'string') return false;

    return matchesSecret(sessionToken, createSessionToken(getConfiguredPresharedKey()));
  } catch (error) {
    if (error instanceof AuthConfigurationError) return false;
    throw error;
  }
}

export async function requireAuthentication(): Promise<void> {
  if (!(await isAuthenticated())) redirect('/login');
}

export async function setAuthenticatedCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, createSessionToken(getConfiguredPresharedKey()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
}
