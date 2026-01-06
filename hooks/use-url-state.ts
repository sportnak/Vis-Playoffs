'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getCurrentRound } from '@/actions/league';

export function useURLState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [defaultRoundId, setDefaultRoundId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentRound = async () => {
      const { data } = await getCurrentRound() as any;
      if (data?.id) {
        setDefaultRoundId(data.id);
      }
    };

    if (!searchParams.get('round')) {
      fetchCurrentRound();
    }
  }, [searchParams]);

  const tab = searchParams.get('tab') || 'scoreboard';
  const round_id = searchParams.get('round');

  const updateURLState = useCallback(
    (updates: { tab?: string; round?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
console.log(params)
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
