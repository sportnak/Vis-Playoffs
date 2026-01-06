'use client';
import { usePoints } from '@/app/leagues/[league_id]/hooks';
import { mapPos } from '@/app/util';
import { Button } from '@/components/ui/button';
import { TeamCard } from './teams';
import { useMemo, useEffect, useState } from 'react';
import { mapRound } from '@/utils';
import { createClient } from '@/utils/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useUIStore } from '@/stores/ui-store';
import { useLeagueStore } from '@/stores/league-store';
import { useUserStore } from '@/stores/user-store';
import { useURLState } from '@/hooks/use-url-state';
import { DraftSummary } from './draft-summary';

export function Scoreboard({ league_id }: { league_id: string }) {
    const round_id = useUIStore((state) => state.round_id);
    const rounds = useLeagueStore((state) => state.rounds);
    const pools = useLeagueStore((state) => state.pools);
    const { updateURLState } = useURLState()
    const member = useUserStore((state) => state.member);

    const currentRound = useMemo(() => {
        return rounds?.find((round) => round.id === round_id);
    }, [rounds, round_id]);

    const { teams: teamSeason, refresh: refreshTeam } = usePoints(league_id, round_id);

    useEffect(() => {
        if (!currentRound?.round_settings?.length) {
            updateURLState({ tab: 'draft' })
        }
    }, [currentRound])

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

    const [showSummary, setShowSummary] = useState(false);
    const [selectedPool, setSelectedPool] = useState<string>('all');

    const sortedTeams = useMemo(() => {
        return [...teamSeason].sort((a, b) => b.seasonScore - a.seasonScore);
    }, [teamSeason]);

    const isDrafting = useMemo(() => {
        return currentRound?.pools?.find((pool) => pool.status !== 'complete') != null;
    }, [currentRound]);

    return (
        <div>
            <div className="flex flex-row justify-between items-start ml-3 mb-8">
                <h2 className="text-md font-light tracking-mono">ROUND: {mapRound(currentRound?.round)}</h2>
                <Button onClick={() => setShowSummary(!showSummary)} variant="subtle" className="mr-5 h-8 tracking-mono">
                    {showSummary ? 'SCORES' : 'DRAFT SUMMARY'}
                </Button>
            </div>

            {isDrafting ? (
                <div className="flex items-center justify-center w-full ml-3">
                    <h2 className="text-2xl font-light">Draft is ongoing</h2>
                </div>
            ) : showSummary ? (
                <div>
                    <div className="mb-4">
                        <Select value={selectedPool} onValueChange={setSelectedPool}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select pool" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {currentRound?.pools.map((pool) => (
                                    <SelectItem key={pool.id} value={pool.id}>
                                        {pool.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DraftSummary
                        teams={teamSeason}
                        pools={pools || []}
                        pool_id={selectedPool === 'all' ? null : selectedPool}
                        round_id={currentRound?.id}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {sortedTeams.map((team) => {
                        const pool = pools?.find(
                            (pool) => pool.draft_order.includes(team.id) && pool.round_id === currentRound?.id
                        );
                        const pointsBack = parseFloat((team.seasonScore - sortedTeams[0].seasonScore).toFixed(2));
                        const yetToPlay = team.team_players.filter((x) => x.pool_id === pool?.id && x.stats == null);
                        const playerCounts = yetToPlay.reduce(
                            (acc, curr) => ({
                                ...acc,
                                [mapPos(curr.player)]: (acc[mapPos(curr.player)] ?? 0) + 1
                            }),
                            {}
                        );
                        const avg = pointsBack / yetToPlay.length;
                        const roundScore =
                            pool && team.poolScores[pool?.id] ? parseFloat(team.poolScores[pool?.id].toFixed(2)) : 0;
                        return (
                            <div
                                key={team.id}
                                className="bg-steel p-5 shadow-sm rounded-md border border-ui-border"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-light truncate">
                                        {team.name}
                                    </h3>
                                    <p className="text-sm font-bold">{team.seasonScore}</p>
                                </div>

                                <div className="mb-4">
                                    <p
                                        className={`text-xs ${pointsBack === 0
                                            ? 'text-cyan'
                                            : pointsBack < -20
                                                ? 'text-semantic-danger'
                                                : pointsBack < -10
                                                    ? 'text-semantic-warning'
                                                    : pointsBack < -5
                                                        ? 'text-semantic-good'
                                                        : 'text-cyan'
                                            }`}
                                    >
                                        {pointsBack === 0 ? 'Leading' : `${pointsBack} back`}
                                    </p>
                                </div>

                                <TeamCard
                                    showScore
                                    team={team}
                                    round={currentRound}
                                    pool={pool}
                                    memberId={member?.id}
                                />

                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-ui-border">
                                    <p className="text-xs tracking-mono">ROUND SCORE</p>
                                    <p className="text-sm font-bold">{roundScore}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

