import { loadMembers, loadPools, loadRounds, loadTeams } from "@/actions/league";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { Team, TeamPlayer } from "@/app/types";
import { setMembers, setRounds } from "@/store/leagueSlice";
import { useCallback, useEffect, useState } from "react";

export function useMembers(league_id: number) {
    const members = useAppSelector((state) => state.league.members);
    const dispatch = useAppDispatch();
    const load = useCallback(async() => {
        const response = await loadMembers({ league_id });
        dispatch(setMembers(response.data));
    }, [league_id])

    useEffect(() => {
        if (members != null || league_id == null) {
            return;
        }
        load();
    }, [members, league_id]);

  return { members, load}
}

export function useRounds(league_id: number) {
    const rounds = useAppSelector((state) => state.league.rounds);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (rounds != null || league_id == null) {
            return;
        }

        async function load() {
            const response = await loadRounds(league_id);
            console.log(response)
            dispatch(setRounds(response.data));
        }

        load();
    }, [league_id]);

  return { rounds }

}

export function usePools(league_id: number, round_id?: number) {
    const [pools, setPools] = useState([])

    const load = useCallback(async() => {
        const response = await loadPools({ league_id, round_id });
        setPools(response.data);
    }, [league_id, round_id ])

    useEffect(() => {
        if (league_id == null) {
            return;
        }

        load();
    }, [league_id, round_id]);

  return { pools, load }
}

export function useTeams(pool_ids: number[]) {
    const [teams, setTeams] = useState<Team[]>([])

    const load = useCallback(async() => {
        if (!pool_ids?.filter(x => x).length) {
            return
        }
        const response = await loadTeams({ pool_ids });
        setTeams(response.data);
    }, [pool_ids, ])

    useEffect(() => {
        if (pool_ids == null) {
            return;
        }
        load();
    }, [pool_ids]);

  return { teams, load }
}