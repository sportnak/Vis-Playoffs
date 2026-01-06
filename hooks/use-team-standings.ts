'use client';

import { useEffect, useMemo } from 'react';
import { usePoints } from '@/app/leagues/[league_id]/hooks';
import { createClient } from '@/utils/supabase/client';
import { useUIStore } from '@/stores/ui-store';
import { useLeagueStore } from '@/stores/league-store';
import { useUserStore } from '@/stores/user-store';

/**
 * Shared hook for team standings data with real-time updates
 * @param league_id - The league ID
 * @param round_id - Optional round ID to filter by. Pass null for all rounds
 */
export function useTeamStandings(league_id: string, round_id: string | null) {
    const rounds = useLeagueStore((state) => state.rounds);
    const pools = useLeagueStore((state) => state.pools);
    const league = useLeagueStore((state) => state.currentLeague);
    const member = useUserStore((state) => state.member);
    const currentUIRoundId = useUIStore((state) => state.round_id);

    const currentRound = useMemo(() => {
        const targetRoundId = round_id || currentUIRoundId;
        return rounds?.find((round) => round.id === targetRoundId);
    }, [rounds, round_id, currentUIRoundId]);

    const { teams: teamSeason, refresh: refreshTeam } = usePoints(league_id, round_id);

    // Real-time updates for stats changes
    useEffect(() => {
        const handleStatsChange = () => {
            refreshTeam();
        };

        const client = createClient();
        const channel = client.channel('supabase_realtime');

        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stats' }, handleStatsChange)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stats' }, handleStatsChange)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stats' }, handleStatsChange)
            .subscribe();

        return () => {
            client.removeChannel(channel);
        };
    }, [refreshTeam]);

    // Sort teams by season score
    const sortedTeams = useMemo(() => {
        return [...teamSeason].sort((a, b) => b.seasonScore - a.seasonScore);
    }, [teamSeason]);

    return {
        teams: teamSeason,
        sortedTeams,
        currentRound,
        rounds,
        pools,
        league,
        member,
        refreshTeam,
    };
}
