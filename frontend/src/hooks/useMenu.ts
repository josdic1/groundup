import { useState, useEffect } from 'react';
import type { MenuItem } from '@groundup/shared-types';
import { fetchMenu } from '../api/menu';

let cachedMenu: MenuItem[] | null = null;
let inFlight: Promise<MenuItem[]> | null = null;

// Shared across every component that calls this — fetches the menu once,
// caches it in module scope, and serves every subsequent call from cache.
// Avoids each screen independently re-fetching the same data.
export function useMenu() {
  const [menu, setMenu] = useState<MenuItem[]>(cachedMenu ?? []);
  const [loading, setLoading] = useState(cachedMenu === null);

  useEffect(() => {
    if (cachedMenu) {
      setMenu(cachedMenu);
      setLoading(false);
      return;
    }
    if (!inFlight) {
      inFlight = fetchMenu();
    }
    inFlight
      .then((items) => {
        cachedMenu = items;
        setMenu(items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { menu, loading };
}

// Call after creating/editing menu items if that's ever added, to force a refetch.
export function invalidateMenuCache() {
  cachedMenu = null;
  inFlight = null;
}
