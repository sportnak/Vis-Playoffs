'use client';
import { loadMembers, loadPools, loadRounds, loadTeams } from '@/actions/league';
import { Team } from '@/app/types';
import { useLeagueStore } from '@/stores/league-store';
import { useCallback, useEffect, useState } from 'react';

export function useMembers(league_id: string) {
    const [members, setMembers] = useState(null);

    const load = useCallback(async () => {
        const response = await loadMembers({ league_id });
        setMembers(response.data);
    }, [league_id]);

    useEffect(() => {
        if (members != null || league_id == null) {
            return;
        }
        load();
    }, [members, league_id, load]);

    return { members, load };
}

export function useRounds(league_id: string) {
    const rounds = useLeagueStore((state) => state.rounds);

    const load = useCallback(async () => {
        const response = await loadRounds(league_id);
        useLeagueStore.getState().setRounds(response.data);
    }, [league_id]);

    useEffect(() => {
        if (rounds?.length || league_id == null) {
            return;
        }
        load();
    }, [rounds?.length, league_id, load]);

    return { rounds, refresh: load };
}

export function usePools(league_id: string, round_id?: string) {
    const [pools, setPools] = useState([]);

    const load = useCallback(async () => {
        const response = await loadPools({ league_id, round_id });
        setPools(response.data);
    }, [league_id, round_id]);

    useEffect(() => {
        if (league_id == null) {
            return;
        }
        load();
    }, [league_id, round_id, load]);

    return { pools, load };
}

export function useTeams(pool_ids: string[]) {
    const [teams, setTeams] = useState<Team[]>([]);

    const poolIdsKey = pool_ids?.join(',') || '';
    const load = useCallback(async () => {
        if (!pool_ids?.filter((x) => x).length) {
            return;
        }
        const response = await loadTeams({ pool_ids });
        setTeams(response);
    }, [poolIdsKey]);

    useEffect(() => {
        if (pool_ids == null) {
            return;
        }
        load();
    }, [poolIdsKey, load]);

    return { teams, load };
}