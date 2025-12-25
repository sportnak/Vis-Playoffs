'use client';
import {
    draftPlayer,
    loadMember,
    loadNFLPlayers,
    loadNFLTeams,
    loadPool,
    loadPools,
    loadTeam,
    loadTeamPlayers,
    loadTeams,
    updateName
} from '@/actions/league';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { setMember, setPool, setTeam } from '@/store/draftSlice';
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

export function useNFLPlayers(
    query: { drafted?: boolean; name?: string; pos: string; team_ids?: string[]; round_id: string },
    pool_id: string,
    league_id: string
) {
    const [nflPlayers, setNFLPlayers] = useState<any>();

    const load = useCallback(async () => {
        if (!pool_id) {
            return;
        }
        const response = await loadNFLPlayers(query, pool_id, league_id);
        const data = response.data;
        console.log('PLayers', data, { query, pool_id, league_id });
        if (query.drafted) {
            data?.sort((a, b) => (b.team_players?.[0]?.pick_number ?? 0) - (a.team_players?.[0]?.pick_number ?? 0));
        }
        setNFLPlayers(data);
    }, [query, pool_id]);

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
    const pool = useAppSelector((state) => state.draft.pool);
    const team = useAppSelector((state) => state.draft.team);
    const pool_id = useMemo(() => [pool?.id], [pool]);
    const { teams } = useTeams(pool_id);
    const dispatch = useAppDispatch();
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

    const load = useCallback(async () => {
        const team = await loadTeam(league_id, member?.id);
        dispatch(setTeam(team.data[0]));
        const pool_response = await loadPool(round_id, league_id);
        const pool = pool_response.data.find((pool) => pool.draft_order.includes(team.data[0].id));
        dispatch(setPool(pool));
    }, [member, league_id, round_id, dispatch]);

    useEffect(() => {
        load();
    }, [load]);

    const handleDraftPlayer = useCallback(
        async (player_id: string, team_id: string) => {
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
