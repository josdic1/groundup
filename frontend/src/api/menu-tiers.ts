import type { MenuItemTiers } from "@groundup/shared-types";
import { STORE_CONFIG } from "../config";

export async function fetchMenuTiers(): Promise<MenuItemTiers[]> {
  const res = await fetch(`${STORE_CONFIG.apiBaseUrl}/menu-tiers`);

  if (!res.ok) {
    throw new Error("Failed to fetch menu tiers");
  }

  return res.json();
}
