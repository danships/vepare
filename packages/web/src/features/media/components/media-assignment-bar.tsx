'use client';
import { Button, Group, Select } from '@mantine/core';
import { useState } from 'react';
import type { ProjectResponse } from '@/features/projects/types';
type Properties = {
  ids: string[];
  projects: ProjectResponse[];
  onAssign: (id: string | null) => Promise<void>;
  allowInbox?: boolean;
};
export function MediaAssignmentBar({ ids, projects, onAssign, allowInbox = true }: Properties) {
  const [target, setTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (ids.length === 0) return null;
  const submit = async (id: string | null) => {
    setLoading(true);
    try {
      await onAssign(id);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Group my="md">
      <Select
        placeholder="Select project"
        data={projects.filter((p) => !p.archivedAt).map((p) => ({ value: p.id, label: p.name }))}
        value={target}
        onChange={setTarget}
      />
      <Button disabled={!target} loading={loading} onClick={() => submit(target)}>
        Add {ids.length} to project
      </Button>
      {allowInbox && (
        <Button variant="light" loading={loading} onClick={() => submit(null)}>
          Return {ids.length} to Inbox
        </Button>
      )}
    </Group>
  );
}
