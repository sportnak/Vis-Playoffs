'use client';
import {
    draftPlayer,
    loadMember,
    loadNFLPlayers,
    loadNFLTeams,
    loadNFLTeamsForRound,
    loadPool,
    loadTeam,
    updateName
} from '@/actions/league';
import { useDraftStore } from '@/stores/draft-store';
import { User } from '@supabase/supabase-js';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRounds, useTeams } from '../manage/hooks';
import { Member, Team } from '@/app/types';

export function useNFLTeams() {
    const [nflTeams, setNFLTeams] = useState([]);

    const load = useCallback(async () => {
        const response = await loadNFLTeams();
        setNFLTeams(response.data);
    }, []);

    useEffect(() => {
        load();
    }, []);

    return { nflTeams, load };
}

export function useNFLTeamsForRound(round_id: string) {
    const [nflTeams, setNFLTeams] = useState<any[]>([]);

    const load = useCallback(async () => {
        if (!round_id) return;
        const response = await loadNFLTeamsForRound(round_id);
        setNFLTeams(response.data || []);
    }, [round_id]);

    useEffect(() => {
        load();
    }, [load]);

    return { nflTeams, load };
}

export function useNFLPlayers(
    query: { drafted?: 'both' | 'drafted' | 'undrafted'; name?: string; pos: string; team_ids?: string[]; round_id: string; page?: number },
    pool_id: string,
    league_id: string
) {
    const [nflPlayers, setNFLPlayers] = useState<any>();

    const load = useCallback(async () => {
        if (!pool_id) {
            console.log('useNFLPlayers: No pool_id provided');
            return;
        }
        const response = await loadNFLPlayers(query, pool_id, league_id);
        const data = response.data;
        if (query.drafted === 'drafted') {
            data?.sort((a, b) => (b.team_players?.[0]?.pick_number ?? 0) - (a.team_players?.[0]?.pick_number ?? 0));
        }
        setNFLPlayers(data);
    }, [query, pool_id, league_id]);

    const hasLoaded = useRef(false);
    const debounced = useRef<any>(null);
    useEffect(() => {
        if (!hasLoaded) {
            load().then(() => (hasLoaded.current = true));
        } else {
            if (debounced.current != null) {
                clearTimeout(debounced.current);
            }
            debounced.current = setTimeout(load, 500);
        }
    }, [load]);

    return { nflPlayers, load };
}

export function useDraft(league_id: string, round_id: string, member: Member) {
    const pool = useDraftStore((state) => state.pool);
    const team = useDraftStore((state) => state.team);
    const setPool = useDraftStore((state) => state.setPool);
    const setTeam = useDraftStore((state) => state.setTeam);

    const pool_ids = useMemo(() => pool?.id ? [pool.id] : [], [pool?.id]);
    const { teams } = useTeams(pool_ids);
    const { rounds } = useRounds(league_id);

    const handleUpdateName = useCallback(
        async (name: string) => {
            if (!team || !pool) {
                return;
            }
            return await updateName(name, team.id);
        },
        [team, pool]
    );

    const member_id = member?.id;
    const load = useCallback(async () => {
        console.log('[useDraft] Starting load with:', { member_id, league_id, round_id });

        if (!member_id) {
            console.error('[useDraft] No member ID found', member_id);
            return;
        }

        const teamResponse = await loadTeam(league_id, member_id);
        console.log('[useDraft] Team response:', teamResponse);

        if (!teamResponse.data || teamResponse.data.length === 0) {
            console.error('[useDraft] No team found for member', member_id);
            return;
        }

        const loadedTeam = teamResponse.data[0];
        console.log('[useDraft] Loaded team:', loadedTeam);
        setTeam(loadedTeam);

        const pool_response = await loadPool(round_id, league_id);
        console.log('[useDraft] Pool response:', pool_response);

        if (!pool_response.data) {
            return;
        }

        const loadedPool = pool_response.data.find((pool) => pool.draft_order.includes(loadedTeam.id));
        console.log('[useDraft] Loaded pool:', loadedPool);
        setPool(loadedPool);
    }, [member_id, league_id, round_id, setTeam, setPool]);

    const hasLoadedRef = useRef(false);
    useEffect(() => {
        if (!hasLoadedRef.current) {
            load();
            hasLoadedRef.current = true;
        }
    }, [load]);

    const handleDraftPlayer = useCallback(
        async (player_id: string, team_id: string) => {
            if (!pool || !team) {
                return null;
            }
            const response = await draftPlayer(league_id, round_id, pool.id, team.id, player_id);
            return response;
        },
        [pool, team, round_id, league_id]
    );

    return {
        team,
        pool,
        draftPlayer: handleDraftPlayer,
        refreshDraft: load,
        teams,
        rounds,
        updateName: handleUpdateName
    };
}

export function usePool(round_id: string, member_id: string) {
    const [pool, setPool] = useState([]);

    const load = useCallback(async () => {
        if (!member_id) {
            return;
        }
        const response = await loadPool(round_id, member_id);
        setPool(response.data);
    }, [round_id, member_id]);

    useEffect(() => {
        load();
    }, [round_id, member_id]);

    return {
        pool
    };
}

export function useTeam(league_id: string, member_id: string) {
    const [team, setTeam] = useState<Team>();

    const handleUpdateName = useCallback(
        async (name: string) => {
            if (!team?.id) {
                return;
            }
            return await updateName(name, team.id);
        },
        [team]
    );

    const load = useCallback(async () => {
        if (!league_id || !member_id) {
            return;
        }

        const response = await loadTeam(league_id, member_id);
        setTeam(response.data[0]);
    }, [league_id, member_id]);

    useEffect(() => {
        load();
    }, [load]);

    return {
        team,
        load,
        updateName: handleUpdateName
    };
}

export function useMember(league_id: string, user: User) {
    const [members, setMembers] = useState([]);

    const load = useCallback(async () => {
        if (!user) {
            return;
        }
        const response = await loadMember(league_id, user);
        console.log(response)
        setMembers(response.data);
    }, [league_id, user]);

    useEffect(() => {
        load();
    }, [league_id, user]);

    return {
        member: members?.[0]
    };
}
