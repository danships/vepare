'use client';
import { Checkbox, Table } from '@mantine/core';
import type { MediaSummary } from '@/features/file-assets/types';
type Properties = { media: MediaSummary[]; selected: string[]; onChange: (ids: string[]) => void };
const size = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
export function MediaTable({ media, selected, onChange }: Properties) {
  const ids = media.map((item) => item.id);
  const all = ids.length > 0 && ids.every((id) => selected.includes(id));
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>
            <Checkbox
              checked={all}
              onChange={() =>
                onChange(all ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])])
              }
            />
          </Table.Th>
          <Table.Th>Filename</Table.Th>
          <Table.Th>MIME type</Table.Th>
          <Table.Th>Size</Table.Th>
          <Table.Th>Registered</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {media.map((item) => (
          <Table.Tr key={item.id}>
            <Table.Td>
              <Checkbox
                checked={selected.includes(item.id)}
                onChange={() =>
                  onChange(
                    selected.includes(item.id) ? selected.filter((id) => id !== item.id) : [...selected, item.id]
                  )
                }
              />
            </Table.Td>
            <Table.Td>{item.originalName}</Table.Td>
            <Table.Td>{item.mimeType}</Table.Td>
            <Table.Td>{size(item.sizeBytes)}</Table.Td>
            <Table.Td>{new Date(item.createdAt).toLocaleString()}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
