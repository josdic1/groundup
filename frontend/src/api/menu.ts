import type { MenuItem } from '@groundup/shared-types';
import { STORE_CONFIG } from '../config';

const BASE = STORE_CONFIG.apiBaseUrl;

export async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${BASE}/menu`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}
