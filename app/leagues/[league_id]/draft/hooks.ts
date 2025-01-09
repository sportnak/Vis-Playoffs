'use client'
import { draftPlayer, loadMember, loadNFLPlayers, loadNFLTeams, loadPool, loadPools, loadTeam, loadTeamPlayers, loadTeams, updateName } from "@/actions/league";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { setMember, setPool, setTeam } from "@/store/draftSlice";
import { User } from "@supabase/supabase-js";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRounds, useTeams } from "../manage/hooks";


export function useNFLTeams() {
        const [nflTeams, setNFLTeams] = useState([])
    
        const load = useCallback(async() => {
            const response = await loadNFLTeams()
            setNFLTeams(response.data);
        }, [])
    
        useEffect(() => {
            load();
        }, []);
    
      return { nflTeams, load }
}

export function useNFLPlayers(query: { name?: string, pos: string, team_ids?: number[], round_id: string }, pool_id: number) {
    const [nflPlayers, setNFLPlayers] = useState([])

    const load = useCallback(async() => {
        if (!pool_id) {
            return
        }
        const response = await loadNFLPlayers(query, pool_id)
        setNFLPlayers(response.data);
    }, [query, pool_id])

    const hasLoaded = useRef(false)
    const debounced = useRef<any>(null)
    useEffect(() => {
        if (!hasLoaded) {
            load().then(()=> hasLoaded.current = true);

        } else {
            if (debounced.current != null) {
                clearTimeout(debounced.current)
            }
            debounced.current = setTimeout(load, 500)
        }
    }, [load]);

  return { nflPlayers, load}

}

export function useDraft(league_id: number, round_id: number, user: User) {
    const member = useAppSelector((state) => state.draft.member);
    const pool = useAppSelector((state) => state.draft.pool);
    const team = useAppSelector((state) => state.draft.team);
    const pool_id = useMemo(() => [pool?.id], [pool])
    const { teams } = useTeams(pool_id)
    const dispatch = useAppDispatch();
    const { rounds } = useRounds()

    const handleUpdateName = useCallback(async (name: string) => {
        if (!team || !pool) {
            return
        }
        return await updateName(name, team.id, pool.id);
    }, [team, pool,])

    const load = useCallback(async() => {
        if (!user) {
            return
        }

        const member_response = await loadMember(league_id, user);
        const member = member_response.data?.[0]
        dispatch(setMember(member));

        
        const pool_response = await loadPool(round_id, member.id);
        dispatch(setPool(pool_response.data[0]));
        
        const team = await loadTeam(pool_response.data[0]?.id, member.id)
        dispatch(setTeam(team.data[0]))
    }, [league_id, round_id, user, dispatch]);

    useEffect(() => {
        load();
    }, [load]);

    const handleDraftPlayer = useCallback(async (player_id: number) => {
        const response = await draftPlayer(round_id, pool.id, team.id, player_id)
        return response
    }, [pool, team, round_id]);

    return {
        member,
        pool,
        draftPlayer: handleDraftPlayer,
        refreshDraft: load,
        teams,
        rounds,
        updateName: handleUpdateName
    }
}

export function usePool(round_id: number, member_id: number) {
    const [pool, setPool] = useState([])

    const load = useCallback(async() => {
        if (!member_id) {
            return
        }
        const response = await loadPool(round_id, member_id)
        setPool(response.data);
    }, [round_id, member_id])

    useEffect(() => {
        load();
    }, [round_id, member_id]);

    return {
        pool
    }
}

export function useMember(league_id: number, user: User) {
    const [members, setMembers] = useState([])

    const load = useCallback(async() => {
        if (!user) {
            return
        }

        const response = await loadMember(league_id, user)
        setMembers(response.data);
    }, [league_id, user])

    useEffect(() => {
        load();
    }, [league_id, user]);

    return {
        member: members?.[0]
    }
}