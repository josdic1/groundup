import { useEffect, useState } from 'react';

export function useIsMobile(breakpoint = 820) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const update = () => {
      setIsMobile(query.matches);
    };

    update();
    query.addEventListener('change', update);

    return () => {
      query.removeEventListener('change', update);
    };
  }, [breakpoint]);

  return isMobile;
}
