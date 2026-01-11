'use client';
import { mapPos } from '@/app/util';
import { Button } from '@/components/ui/button';
import { TeamCard } from './teams';
import { useMemo, useState } from 'react';
import { mapRound } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useURLState } from '@/hooks/use-url-state';
import { DraftSummary } from './draft-summary';
import { useTeamStandings } from '@/hooks/use-team-standings';
import { getRankIcon, calculatePointsBack, getPointsBackColor, getPointsBackText } from '@/utils/standings-utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/utils/standings-utils';
import { Badge } from '@/components/ui/badge';

export function Scoreboard({ league_id }: { league_id: string }) {
    const { updateURLState } = useURLState();

    // Note: For scoreboard, we pass null to get all teams' season scores,
    // but we filter by currentRound for display purposes
    const { teams: teamSeason, sortedTeams, currentRound, pools, member, league, isRefreshing } = useTeamStandings(
        league_id,
        null
    );

    const [showSummary, setShowSummary] = useState(false);
    const [selectedPool, setSelectedPool] = useState<string>('all');

    const isDrafting = useMemo(() => {
        return currentRound?.pools?.find((pool) => pool.status !== 'complete') != null;
    }, [currentRound]);

    return (
        <div>
            <div className="flex flex-row justify-between items-start ml-3 mb-8">
                <div className="flex items-center gap-3">
                    <h2 className="text-md font-light tracking-mono">ROUND: {mapRound(currentRound?.round)}</h2>
                    {isRefreshing && (
                        <div className="flex items-center gap-2 text-xs text-cool-gray">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="tracking-mono">SYNCING</span>
                        </div>
                    )}
                </div>
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
                        rounds={[currentRound]}
                        pool_id={selectedPool === 'all' ? null : selectedPool}
                        round_id={currentRound?.id}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {sortedTeams.map((team, index) => {
                        const rank = index + 1;
                        const pool = pools?.find(
                            (pool) => pool.draft_order.includes(team.id) && pool.round_id === currentRound?.id
                        );
                        const teamMember = league?.league_members?.find((m) => m.id === team.member_id);
                        const pointsBack = calculatePointsBack(team.seasonScore, sortedTeams[0].seasonScore);
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
                        const playersWithStats = team.team_players.filter((x) => x.pool_id === pool?.id && x.stats != null);
                        const pointsPerPlayer = playersWithStats.length > 0 ? (roundScore / playersWithStats.length) : 0;
                        const remainingPlayers = yetToPlay.length;
                        const calculatePowerValue = (pickNumber: number) => {
                            if (!pool?.draft_order) return 0;
                            const teamsInRound = pool.draft_order.length;
                            const round = Math.ceil(pickNumber / teamsInRound);
                            const indexInRound = ((pickNumber - 1) % teamsInRound) + 1;
                            const pickValue = round + (Math.pow(indexInRound, 3) / 100);
                            return 5 / pickValue;
                        };

                        const remainingPower = yetToPlay.reduce((sum, player) => {
                            return sum + calculatePowerValue(player.pick_number || 1);
                        }, 0);
                        const usedPower = playersWithStats.reduce((sum, player) => {
                            return sum + calculatePowerValue(player.pick_number || 1);
                        }, 0);
                        const efficiency = usedPower > 0 ? roundScore / usedPower : 0;
                        return (
                            <div
                                key={team.id}
                                className={`bg-steel p-3 md:p-5 shadow-sm rounded-md border ${rank === 1
                                        ? 'border-yellow-500 bg-yellow-500/5'
                                        : rank === 2
                                            ? 'border-gray-400 bg-gray-400/5'
                                            : rank === 3
                                                ? 'border-amber-700 bg-amber-700/5'
                                                : 'border-ui-border'
                                    } ${teamMember?.id === member?.id ? 'ring-2 ring-frost/30' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        {getRankIcon(rank)}
                                        <h3 className={`text-base md:text-lg font-light truncate ${rank <= 3 ? 'font-semibold' : ''}`}>
                                            {team.name}
                                        </h3>
                                    </div>
                                    <p className={`text-sm font-bold ${rank <= 3 ? 'md:text-lg' : ''}`}>{team.seasonScore}</p>
                                </div>

                                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4 text-[9px] md:text-[10px] text-muted-foreground">
                                    <div className="flex items-center gap-0.5 md:gap-1">
                                        <span>PPP:</span>
                                        <span className="font-medium">{pointsPerPlayer.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 md:gap-1">
                                        <span>REM:</span>
                                        <span className="font-medium">{remainingPlayers}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 md:gap-1">
                                        <span>PWR:</span>
                                        <span className="font-medium">{remainingPower.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 md:gap-1">
                                        <span>USED:</span>
                                        <span className="font-medium">{usedPower.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 md:gap-1">
                                        <span>EFF:</span>
                                        <span className="font-medium">{efficiency.toFixed(1)}</span>
                                    </div>
                                </div>

                                <div className="mb-2 md:mb-4 flex items-center justify-between">
                                    <p className={`text-xs ${getPointsBackColor(pointsBack)}`}>
                                        {getPointsBackText(pointsBack)}
                                    </p>
                                    {pool && (
                                        <Badge variant="outline" className="text-xs">
                                            {pool.name}
                                        </Badge>
                                    )}
                                </div>

                                <TeamCard
                                    showScore
                                    team={team}
                                    round={currentRound}
                                    pool={pool}
                                    memberId={member?.id}
                                />

                                <div className="flex justify-between items-center mt-2 md:mt-3 pt-2 md:pt-3 border-t border-ui-border">
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

