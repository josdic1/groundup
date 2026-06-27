import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { MenuItem } from '@groundup/shared-types';
import {
  createMenuItem,
  fetchAdminMenu,
  updateMenuItem,
  type NewMenuItemInput,
} from '../api/menu';

type MenuContextValue = {
  menu: MenuItem[];
  activeMenu: MenuItem[];
  categories: string[];
  loading: boolean;
  error: string | null;
  refreshMenu: () => Promise<void>;
  saveMenuItem: (id: string, changes: Partial<MenuItem>) => Promise<void>;
  addMenuItem: (data: NewMenuItemInput) => Promise<void>;
};

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminMenu();
      setMenu(data);
    } catch (err) {
      console.error(err);
      setError('Could not load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMenu();
  }, []);

  const activeMenu = useMemo(
    () => menu.filter((item) => item.isActive),
    [menu]
  );

  const categories = useMemo(
    () => Array.from(new Set(menu.map((item) => item.category))).sort(),
    [menu]
  );

  const saveMenuItem = async (id: string, changes: Partial<MenuItem>) => {
    const updated = await updateMenuItem(id, changes);
    setMenu((items) => items.map((item) => (item.id === id ? updated : item)));
  };

  const addMenuItem = async (data: NewMenuItemInput) => {
    const created = await createMenuItem(data);
    setMenu((items) => [created, ...items]);
  };

  return (
    <MenuContext.Provider
      value={{
        menu,
        activeMenu,
        categories,
        loading,
        error,
        refreshMenu,
        saveMenuItem,
        addMenuItem,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenuContext() {
  const value = useContext(MenuContext);
  if (!value) throw new Error('useMenuContext must be used inside MenuProvider');
  return value;
}
