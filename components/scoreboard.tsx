'use client';
import { usePoints } from '@/app/leagues/[league_id]/hooks';
import { Team } from '@/app/types';
import { mapPos } from '@/app/util';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
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
        console.log(currentRound.round_settings?.length)
        if (!currentRound.round_settings?.length) {
            console.log('setting tab')
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

function totalPoints(team: Team, pool_id?: string) {
    const total =
        team?.team_players
            .filter((x) => !pool_id || x.pool_id === pool_id)
            .reduce((acc, player) => acc + player.score, 0) ?? 0;
    return parseFloat(total.toFixed(2));
}

const statsKeys = [
    'rec',
    'rec_yds',
    'rec_td',
    'rush_yds',
    'rush_att',
    'rush_td',
    'pass_att',
    'pass_yds',
    'pass_td',
    'fum',
    'int'
];
function mapStatNameShort(stat) {
    switch (stat) {
        case 'pass_att':
            return 'Pass';
        case 'pass_yds':
            return 'Pass Yds';
        case 'pass_td':
            return 'Pass TDs';
        case 'rush_att':
            return 'Rush';
        case 'rush_yds':
            return 'Rush Yds';
        case 'rush_td':
            return 'Rush TDs';
        case 'fum':
            return 'Fum';
        case 'int':
            return 'Ints';
        case 'rec':
            return 'Rec';
        case 'rec_yds':
            return 'Rec Yds';
        case 'rec_td':
            return 'Rec TDs';
        default:
            return stat;
    }
}

function DraftSummary({ teams, pools, round_id, pool_id }) {
    const pools_by_round = useMemo(() => {
        return pools.reduce(
            (acc, pool) => ({
                ...acc,
                [pool.round_id]: [...(acc[pool.round_id] || []), pool]
            }),
            {}
        );
    }, [pools]);

    const teams_by_id = useMemo(() => {
        return teams?.reduce((acc, team) => {
            acc[team.id] = team.name;
            return acc;
        }, {});
    }, [teams]);
    const summary = useMemo(() => {
        let pool_ids = [];
        if (pool_id) {
            pool_ids = [pool_id];
        } else if (round_id) {
            pool_ids = pools_by_round[round_id]?.map((x) => x.id);
        } else {
            pool_ids = pools.map((x) => x.id);
        }
        console.log(
            round_id,
            pool_ids,
            pools.map((x) => x.id)
        );
        const grouped = teams.reduce((acc, team) => {
            for (const player of team.team_players) {
                if (!pool_ids.includes(player.pool_id)) {
                    continue;
                }
                if (!acc[player.player_id]) {
                    acc[player.player_id] = [player];
                } else {
                    acc[player.player_id].push(player);
                }
            }
            return acc;
        }, {});

        const summaries = [];
        for (const playerId in grouped) {
            const players = grouped[playerId];
            const pos = players.map((x) => x.pick_number);
            const adp = players.reduce((acc, player) => acc + player.pick_number, 0) / players.length;

            summaries.push({
                adp,
                team: teams_by_id[players[0].team_id],
                points: players[0].score,
                stats: players[0].stats,
                min: Math.min(...pos),
                max: Math.max(...pos),
                name: players[0].player.name
            });
        }
        summaries.sort((a, b) => a.adp - b.adp);
        return summaries;
    }, [teams, pools, round_id, pool_id]);

    return (
        <div className="w-full max-h-screen overflow-scroll">
            <Table className="w-full">
                <TableHeader>
                    <TableRow style={{ position: 'sticky', top: 0, background: '#1A1E25', zIndex: 2 }}>
                        <TableHead
                            style={{ width: '120px', position: 'sticky', left: 0, background: '#1A1E25', zIndex: 1 }}
                        >
                            Name
                        </TableHead>
                        <TableHead style={{ width: '40px' }}>
                            {pool_id == null ? 'ADP' : 'Pos'}
                        </TableHead>
                        {pool_id != null && <TableHead style={{ width: '40px' }}>Team</TableHead>}
                        {pool_id == null && <TableHead style={{ width: '40px' }}>Min</TableHead>}
                        {pool_id == null && <TableHead style={{ width: '40px' }}>Max</TableHead>}
                        <TableHead style={{ width: '40px' }}>Points</TableHead>
                        {statsKeys.map((key) => (
                            <TableHead key={key}>{mapStatNameShort(key)}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {summary.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell
                                style={{
                                    fontWeight: 'bold',
                                    width: '120px',
                                    position: 'sticky',
                                    left: 0,
                                    background: '#1A1E25',
                                    zIndex: 1
                                }}
                            >
                                {item.name}
                            </TableCell>
                            <TableCell style={{ width: '40px' }}>
                                {pool_id == null ? item.adp.toFixed(2) : Math.floor(parseFloat(item.adp))}
                            </TableCell>
                            {pool_id != null && <TableCell style={{ width: '40px' }}>{item.team}</TableCell>}
                            {pool_id == null && <TableCell style={{ width: '40px' }}>{item.min}</TableCell>}
                            {pool_id == null && <TableCell style={{ width: '40px' }}>{item.max}</TableCell>}
                            <TableCell style={{ width: '40px' }}>{item.points}</TableCell>
                            {statsKeys.map((key) => (
                                <TableCell key={key}>{item.stats?.[key] ?? 0}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
