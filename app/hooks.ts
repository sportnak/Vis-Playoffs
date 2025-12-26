'use client';

import { typedClient } from '@/utils/supabase/supabase';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useLeagueStore } from '@/stores/league-store';
import { loadLeagues } from '@/actions/league';

export function useUser(): { user: User | null } {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function loadUser() {
            const {
                data: { user: fetchedUser }
            } = await typedClient.auth.getUser();
            setUser(fetchedUser);
        }

        loadUser();
    }, [router]);

    return { user };
}

/**
 * Get the current league from the store by league_id
 * @param league_id string from route param
 * @returns the league object
 */
export function useLeague(league_id: string) {
    const leagues = useLeagueStore((state) => state.leagues);
    const league = useMemo(() => {
        if (leagues && league_id) {
            return leagues.find((l) => l.id === league_id);
        }
        return null;
    }, [leagues, league_id]);

    return { league };
}

export function useLeagues() {
    const leagues = useLeagueStore((state) => state.leagues);
    const setLeagues = useLeagueStore((state) => state.setLeagues);
    const { user } = useUser();

    const load = useCallback(async () => {
        if (!user) return;
        const response = await loadLeagues(user);
        setLeagues(response.data);
    }, [user, setLeagues]);

    useEffect(() => {
        if (leagues != null || user == null) {
            return;
        }
        load();
    }, [leagues, user, load]);

    return { leagues, refresh: load };
}
