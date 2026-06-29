import { STORE_CONFIG } from "../config";

const BASE = STORE_CONFIG.apiBaseUrl;

export async function resetToEmpty(): Promise<void> {
  const res = await fetch(`${BASE}/demo/empty`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to clear data");
}

export async function resetToDemoData(): Promise<void> {
  const res = await fetch(`${BASE}/demo/seed`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to load demo data");
}
