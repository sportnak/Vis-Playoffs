import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function useURLState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = searchParams.get('tab') || 'scoreboard';
  const round_id = searchParams.get('round') || '4';

  const updateURLState = useCallback(
    (updates: { tab?: string; round?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.tab !== undefined) {
        params.set('tab', updates.tab);
      }

      if (updates.round !== undefined) {
        params.set('round', updates.round);
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return {
    tab,
    round_id,
    updateURLState,
  };
}
