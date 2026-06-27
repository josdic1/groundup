import type { MenuItem } from '@groundup/shared-types';
import { STORE_CONFIG } from '../config';

const BASE = STORE_CONFIG.apiBaseUrl;

export type NewMenuItemInput = Omit<MenuItem, 'id'> & { id?: string };

export async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${BASE}/menu`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}

export async function fetchAdminMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${BASE}/menu/admin`);
  if (!res.ok) throw new Error('Failed to fetch admin menu');
  return res.json();
}

export async function updateMenuItem(
  id: string,
  changes: Partial<MenuItem>
): Promise<MenuItem> {
  const res = await fetch(`${BASE}/menu/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error('Failed to update menu item');
  return res.json();
}

export async function createMenuItem(data: NewMenuItemInput): Promise<MenuItem> {
  const res = await fetch(`${BASE}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create menu item');
  return res.json();
}
