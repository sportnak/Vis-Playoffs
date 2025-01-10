import { loadPoints } from '@/actions/league';
import { useCallback, useEffect, useState } from 'react';

export function usePoints(league_id: number, round_id?: number) {
    const [teams, setTeams] = useState([]);

    const load = useCallback(async () => {
        const response = await loadPoints({ league_id, round_id });
        setTeams(response);
    }, [league_id, round_id]);

    useEffect(() => {
        load();
    }, [load, league_id, round_id]);

    return {
        teams,
        refresh: () => {}
    };
}
