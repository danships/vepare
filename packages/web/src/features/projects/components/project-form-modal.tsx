'use client';
import { Alert, Button, Modal, TextInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createProjectClient } from '../client';
export function ProjectFormModal() {
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const submit = async () => {
    setLoading(true);
    try {
      await createProjectClient(name);
      setOpened(false);
      setName('');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not create project.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Button onClick={() => setOpened(true)}>Create project</Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title="Create project">
        <TextInput
          label="Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          maxLength={100}
          required
        />
        {error && (
          <Alert color="red" mt="sm">
            {error}
          </Alert>
        )}
        <Button mt="md" loading={loading} disabled={!name.trim()} onClick={submit}>
          Create
        </Button>
      </Modal>
    </>
  );
}
