const BASE = 'http://localhost:3001/api';

export async function resetToEmpty(): Promise<void> {
  const res = await fetch(`${BASE}/demo/empty`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clear data');
}

export async function resetToDemoData(): Promise<void> {
  const res = await fetch(`${BASE}/demo/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to load demo data');
}
