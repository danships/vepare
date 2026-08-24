'use client';

import { Alert, Button, PasswordInput, Stack } from '@mantine/core';
import { useActionState } from 'react';

import { login, type LoginActionState } from './actions';

const initialState: LoginActionState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction}>
      <Stack gap="md">
        {state.error ? (
          <Alert color="red" role="alert" title="Unable to sign in">
            {state.error}
          </Alert>
        ) : null}
        <PasswordInput autoComplete="current-password" autoFocus label="Preshared key" name="presharedKey" required />
        <Button disabled={isPending} loading={isPending} type="submit">
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </Stack>
    </form>
  );
}
