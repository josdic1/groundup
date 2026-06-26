import type { MenuItem } from '@groundup/shared-types';

const BASE = 'http://localhost:3001/api';

export async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${BASE}/menu`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}
