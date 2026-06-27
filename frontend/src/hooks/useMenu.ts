import { useMenuContext } from '../providers/MenuProvider';

export function useMenu() {
  const { activeMenu, loading } = useMenuContext();
  return { menu: activeMenu, menuItems: activeMenu, loading };
}

export function invalidateMenuCache() {
  // MenuProvider owns menu state now.
}
