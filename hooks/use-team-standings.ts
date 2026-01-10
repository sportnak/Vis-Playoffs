'use client';

import { useEffect, useMemo, useState } from 'react';
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
    const [isRefreshing, setIsRefreshing] = useState(false);

    const currentRound = useMemo(() => {
        const targetRoundId = round_id || currentUIRoundId;
        return rounds?.find((round) => round.id === targetRoundId);
    }, [rounds, round_id, currentUIRoundId]);

    const { teams: teamSeason, refresh: refreshTeam } = usePoints(league_id, round_id);

    // Real-time updates for stats changes
    useEffect(() => {
        let debounceTimer: NodeJS.Timeout | null = null;

        const handleStatsChange = async () => {
            console.log('Stats changed, debouncing refresh...');
            setIsRefreshing(true);

            // Clear existing timer
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            // Set new timer to refresh after 1 second of no updates
            debounceTimer = setTimeout(async () => {
                console.log('Refreshing team standings...');
                await refreshTeam();
                setTimeout(() => setIsRefreshing(false), 500);
            }, 1000);
        };

        const client = createClient();
        const channel = client.channel('supabase_realtime');
        console.log("Subscribing to stats changes...");
        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stats' }, handleStatsChange)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stats' }, handleStatsChange)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stats' }, handleStatsChange)
            .subscribe();

        return () => {
            console.log('Unsubscribing from stats changes...');
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
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
        isRefreshing,
    };
}
