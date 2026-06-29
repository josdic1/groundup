import type { Staff } from "@groundup/shared-types";
import { STORE_CONFIG } from "../config";

export async function fetchStaff(): Promise<Staff[]> {
  const res = await fetch(`${STORE_CONFIG.apiBaseUrl}/staff`);

  if (!res.ok) {
    throw new Error("Failed to fetch staff");
  }

  return res.json();
}
