'use server';

import { redirect } from 'next/navigation';

import { AuthConfigurationError, getConfiguredPresharedKey, setAuthenticatedCookie } from '@/lib/auth';
import { matchesSecret } from '@/lib/auth-crypto';

export type LoginActionState = {
  error: string | null;
};

const INVALID_PRESHARED_KEY_MESSAGE = 'Invalid preshared key.';

function recordAuthEvent(event: 'auth.login_failed' | 'auth.login_succeeded' | 'auth.configuration_error'): void {
  console.info(JSON.stringify({ event, timestamp: new Date().toISOString() }));
}

export async function login(_previousState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const presharedKeyValues = formData.getAll('presharedKey');
  const presharedKey = presharedKeyValues[0];

  if (
    presharedKeyValues.length !== 1 ||
    typeof presharedKey !== 'string' ||
    presharedKey.length === 0 ||
    presharedKey.length > 1024
  ) {
    return { error: INVALID_PRESHARED_KEY_MESSAGE };
  }

  let configuredPresharedKey: string;

  try {
    configuredPresharedKey = getConfiguredPresharedKey();
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      recordAuthEvent('auth.configuration_error');
      return { error: 'Sign-in is unavailable.' };
    }
    throw error;
  }

  if (!matchesSecret(presharedKey, configuredPresharedKey)) {
    recordAuthEvent('auth.login_failed');
    return { error: INVALID_PRESHARED_KEY_MESSAGE };
  }

  try {
    await setAuthenticatedCookie();
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      recordAuthEvent('auth.configuration_error');
      return { error: 'Sign-in is unavailable.' };
    }
    throw error;
  }

  recordAuthEvent('auth.login_succeeded');
  redirect('/');
}
