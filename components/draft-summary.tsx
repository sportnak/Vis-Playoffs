'use client';
import { Team } from '@/app/types';
import { mapPos } from '@/app/util';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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

interface DraftSummaryProps {
    teams: Team[];
    pools: any[];
    rounds: any[];
    round_id?: string;
    pool_id?: string | null;
}

function getExpectedPoints(adp: number, roundNumber: number): number {
    const steps = [
        { max: 25, min: 20 },
        { max: 20, min: 15 },
        { max: 15, min: 12 },
        { max: 12, min: 10 }
    ];

    const teamsPerRound = roundNumber === 2 ? 12 : roundNumber === 3 ? 8 : roundNumber === 4 ? 4 : 2;

    const stepIndex = Math.floor((adp - 1) / teamsPerRound);
    const positionInStep = ((adp - 1) % teamsPerRound) + 1;

    if (stepIndex >= steps.length) {
        return steps[steps.length - 1].min;
    }

    const step = steps[stepIndex];
    const stepProgress = (positionInStep - 1) / (teamsPerRound - 1);

    return step.max - (step.max - step.min) * stepProgress;
}

export function DraftSummary({ teams, pools, rounds, round_id, pool_id }: DraftSummaryProps) {
    const [sortBy, setSortBy] = useState<'adp' | 'points' | 'value'>('adp');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [posFilter, setPosFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [roundFilter, setRoundFilter] = useState<string>(round_id || '');

    const pools_by_round = useMemo(() => {
        return pools.reduce(
            (acc, pool) => ({
                ...acc,
                [pool.round_id]: [...(acc[pool.round_id] || []), pool]
            }),
            {}
        );
    }, [pools]);

    const pool_to_round_number = useMemo(() => {
        const mapping = {};
        pools.forEach((pool) => {
            const round = rounds?.find((r) => r.id === pool.round_id);
            if (round) {
                mapping[pool.id] = round.round;
            }
        });
        return mapping;
    }, [pools, rounds]);

    const teams_by_id = useMemo(() => {
        return teams?.reduce((acc, team) => {
            acc[team.id] = team.name;
            return acc;
        }, {});
    }, [teams]);

    const summary = useMemo(() => {
        if (!Array.isArray(teams) || !Array.isArray(pools)) {
            return [];
        }

        let pool_ids = [];
        const activeRoundId = roundFilter || round_id;

        if (pool_id) {
            pool_ids = [pool_id];
        } else if (activeRoundId) {
            pool_ids = pools_by_round[activeRoundId]?.map((x) => x.id);
        } else {
            pool_ids = pools.map((x) => x.id);
        }

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

        // Calculate the maximum pick_number for each pool to use as undrafted value
        const maxPickByPool = {};
        for (const team of teams) {
            for (const player of team.team_players) {
                if (!pool_ids.includes(player.pool_id)) continue;
                if (!maxPickByPool[player.pool_id] || player.pick_number > maxPickByPool[player.pool_id]) {
                    maxPickByPool[player.pool_id] = player.pick_number;
                }
            }
        }

        const summaries = [];
        for (const playerId in grouped) {
            const players = grouped[playerId];

            // Group players by round to handle cross-round scenarios
            const playersByRound = players.reduce((acc, p) => {
                const rnd = pool_to_round_number[p.pool_id];
                if (!acc[rnd]) acc[rnd] = [];
                acc[rnd].push(p);
                return acc;
            }, {});

            // Use the round with the most entries (or first round if tied)
            const primaryRound = Object.keys(playersByRound).sort((a, b) =>
                playersByRound[b].length - playersByRound[a].length
            )[0];

            const playersInPrimaryRound = playersByRound[primaryRound];
            const pos = playersInPrimaryRound.map((x) => x.pick_number);
            const min = Math.min(...pos);
            const max = Math.max(...pos);

            // Calculate the maximum possible pick for this round
            const roundNumber = parseInt(primaryRound);

            // Determine how many pools are being compared in this specific round
            const totalPoolsInRound = pool_ids.filter(id => pool_to_round_number[id] === roundNumber).length;

            // Get the maximum pick number across all pools in this round for undrafted value
            const poolsInRound = pool_ids.filter(id => pool_to_round_number[id] === roundNumber);
            const maxPickInRound = Math.max(...poolsInRound.map(pid => maxPickByPool[pid] || 0));

            // If player was only drafted in one pool (but we're comparing multiple pools),
            // treat undrafted as maxPickInRound + 1 when calculating ADP
            const undraftedValue = maxPickInRound + 1;
            const adp = playersInPrimaryRound.length < totalPoolsInRound
                ? (playersInPrimaryRound.reduce((acc, player) => acc + player.pick_number, 0) + (undraftedValue * (totalPoolsInRound - playersInPrimaryRound.length))) / totalPoolsInRound
                : playersInPrimaryRound.reduce((acc, player) => acc + player.pick_number, 0) / playersInPrimaryRound.length;

            const expectedPoints = getExpectedPoints(adp, roundNumber);

            // Only calculate value if player has stats
            let value = null;
            let scaledValue = null;
            if (players[0].stats != null) {
                const rawValue = players[0].score - expectedPoints;
                // Scale the value: divide by expected points to get a percentage-based metric
                // This gives us a sense of "how much better/worse than expected" as a ratio
                scaledValue = (rawValue / expectedPoints) * 100;
                value = rawValue;
            }

            summaries.push({
                adp,
                team: teams_by_id[playersInPrimaryRound[0].team_id],
                points: playersInPrimaryRound[0].score,
                stats: playersInPrimaryRound[0].stats,
                min,
                max,
                maxPickInRound,
                draftedInPoolCount: playersInPrimaryRound.length,
                totalPoolsInRound,
                name: playersInPrimaryRound[0].player.name,
                position: mapPos(playersInPrimaryRound[0].player),
                playerId,
                roundNumber,
                expectedPoints,
                value,
                scaledValue
            });
        }

        return summaries;
    }, [teams, pools, roundFilter, round_id, pool_id, teams_by_id, pools_by_round, pool_to_round_number]);

    // Calculate statistics for z-scores
    const valueStats = useMemo(() => {
        const validValues = summary.filter((x) => x.value !== null).map((x) => x.value);
        if (validValues.length === 0) return { mean: 0, stdDev: 1 };

        const mean = validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
        const variance =
            validValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / validValues.length;
        const stdDev = Math.sqrt(variance);

        return { mean, stdDev: stdDev || 1 };
    }, [summary]);

    // Add z-scores, stars, and percentile ranks to summary
    const enrichedSummary = useMemo(() => {
        return summary.map((item) => {
            if (item.value === null) {
                return { ...item, zScore: null, stars: 0, percentileRank: null, relativeChart: null };
            }

            // Calculate z-score
            const zScore = (item.value - valueStats.mean) / valueStats.stdDev;

            // Convert z-score to stars (1-5)
            let stars = 3;
            if (zScore >= 1.5) stars = 5;
            else if (zScore >= 0.5) stars = 4;
            else if (zScore >= -0.5) stars = 3;
            else if (zScore >= -1.5) stars = 2;
            else stars = 1;

            // Calculate percentile rank within ±5 picks and generate chart
            const adpRange = summary
                .filter((x) => x.value !== null && Math.abs(x.adp - item.adp) <= 5)
                .sort((a, b) => a.value - b.value);

            const betterThan = adpRange.filter((x) => x.value < item.value).length;
            const percentileRank = adpRange.length > 1 ? (betterThan / (adpRange.length - 1)) * 100 : null;

            return { ...item, zScore, stars, percentileRank, relativeChart: null };
        });
    }, [summary, valueStats]);

    const filteredAndSorted = useMemo(() => {
        let filtered = enrichedSummary;

        // Filter by position
        if (posFilter !== 'all') {
            filtered = filtered.filter((item) => item.position === posFilter);
        }

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'adp') {
                comparison = a.adp - b.adp;
            } else if (sortBy === 'points') {
                comparison = b.points - a.points;
            } else if (sortBy === 'value') {
                // Handle null values - put them at the end
                if (a.scaledValue === null && b.scaledValue === null) return 0;
                if (a.scaledValue === null) return 1;
                if (b.scaledValue === null) return -1;
                comparison = b.scaledValue - a.scaledValue;
            }
            return sortDir === 'asc' ? comparison : -comparison;
        });

        // Generate relativeChart based on filtered and sorted data
        // Sort filtered players by ADP for the chart calculation
        const sortedByADP = [...filtered].sort((a, b) => a.adp - b.adp);

        filtered = filtered.map((item) => {
            let relativeChart = null;
            const currentIndex = sortedByADP.findIndex((x) => x.playerId === item.playerId);

            if (currentIndex !== -1) {
                // Collect values from the 5 picks before and after
                const rangeValues = [];
                for (let i = 0; i < 9; i++) {
                    const dataIndex = currentIndex - 4 + i;
                    if (dataIndex >= 0 && dataIndex < sortedByADP.length) {
                        const player = sortedByADP[dataIndex];
                        if (player.value !== null) {
                            rangeValues.push({ value: player.value, index: i });
                        }
                    }
                }

                // Sort by value to calculate quartiles
                const sortedValues = [...rangeValues].sort((a, b) => a.value - b.value);

                // Calculate quartile thresholds
                const getQuartile = (value: number) => {
                    if (sortedValues.length === 0) return 2;
                    const rank = sortedValues.findIndex(v => v.value === value);
                    const percentile = rank / (sortedValues.length - 1 || 1);
                    if (percentile <= 0.2) return 0; // Bottom quartile
                    if (percentile <= 0.4) return 1;  // Second quartile
                    if (percentile <= 0.6) return 2; // Third quartile
                    if (percentile <= 0.8) return 3; // Fourth quartile
                    return 4; // Top quartile
                };

                const bars = [];
                const barCharts = ['▃', '▄', '▅', '▆', '▇', '█']

                for (let i = 0; i < 9; i++) {
                    const dataIndex = currentIndex - 4 + i;
                    if (dataIndex >= 0 && dataIndex < sortedByADP.length) {
                        const player = sortedByADP[dataIndex];
                        if (player.value === null) {
                            bars.push({ char: '▁', quintile: null, isCurrent: i === 4 });
                        } else {
                            const quintile = getQuartile(player.value);
                            bars.push({ char: barCharts[quintile], quintile, isCurrent: i === 4 });
                        }
                    } else {
                        bars.push({ char: '▁', quintile: null, isCurrent: false });
                    }
                }
                relativeChart = bars
            }

            return { ...item, relativeChart };
        });

        return filtered;
    }, [enrichedSummary, posFilter, searchQuery, sortBy, sortDir]);

    const maxPoints = useMemo(() => {
        return Math.max(...summary.map((x) => x.points), 1);
    }, [summary]);

    const toggleSort = (column: 'adp' | 'points' | 'value') => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir(column === 'adp' ? 'asc' : 'desc');
        }
    };

    const toggleRow = (playerId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(playerId)) {
            newExpanded.delete(playerId);
        } else {
            newExpanded.add(playerId);
        }
        setExpandedRows(newExpanded);
    };

    const positions = useMemo(() => {
        if (!Array.isArray(summary)) {
            return ['all'];
        }
        const posSet = new Set(summary.map((x) => x.position));
        return ['all', ...Array.from(posSet).sort()];
    }, [summary]);

    const getValueColor = (scaledValue: number | null) => {
        if (scaledValue === null) return 'text-gray-400';
        // Scaled value is a percentage, so thresholds are different
        if (scaledValue > 25) return 'text-semantic-good';  // 25%+ better than expected
        if (scaledValue > 0) return 'text-cyan';             // Better than expected
        if (scaledValue > -25) return 'text-semantic-warning'; // Within 25% of expected
        return 'text-semantic-danger';                       // 25%+ worse than expected
    };

    const availableRounds = useMemo(() => {
        const roundIds = new Set(pools.map((p) => p.round_id));
        return rounds.filter((r) => roundIds.has(r.id));
    }, [pools, rounds]);

    return (
        <div className="w-full">
            <div className="flex gap-4 mb-4 items-center flex-wrap">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 bg-steel border border-ui-border rounded-md text-sm"
                    />
                </div>
                <Select value={roundFilter} onValueChange={setRoundFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Round" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRounds.map((round) => (
                            <SelectItem key={round.id} value={round.id}>
                                {round.round === 2 ? 'Wildcard' : round.round === 3 ? 'Divisional' : round.round === 4 ? 'Conference' : `Round ${round.round}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={posFilter} onValueChange={setPosFilter}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                        {positions.map((pos) => (
                            <SelectItem key={pos} value={pos}>
                                {pos === 'all' ? 'All Pos' : pos}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full max-h-[calc(100vh-300px)] overflow-auto rounded-md border border-ui-border">
                <Table className="w-full text-xs md:text-sm">
                    <TableHeader>
                        <TableRow style={{ position: 'sticky', top: 0, background: '#1A1E25', zIndex: 2 }}>
                            <TableHead
                                className="px-1 py-2 md:px-3"
                                style={{ width: '45px', cursor: 'pointer' }}
                                onClick={() => toggleSort('adp')}
                            >
                                {pool_id == null ? 'ADP' : 'Pick'} {sortBy === 'adp' && (sortDir === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead
                                className="px-2 py-2"
                                style={{ width: '140px', position: 'sticky', left: 0, background: '#1A1E25', zIndex: 3 }}
                            >
                                <span className="md:hidden">Player</span>
                                <span className="hidden md:inline">Player</span>
                            </TableHead>
                            {pool_id != null && <TableHead className="px-1 py-2 md:px-3" style={{ width: '80px' }}>Team</TableHead>}
                            {pool_id == null && <TableHead className="px-1 py-2 md:px-3" style={{ width: '60px' }}>Range</TableHead>}
                            <TableHead
                                className="px-1 py-2 md:px-3"
                                style={{ width: '60px', cursor: 'pointer' }}
                                onClick={() => toggleSort('points')}
                            >
                                <span className="md:hidden">Pts</span>
                                <span className="hidden md:inline">Points</span> {sortBy === 'points' && (sortDir === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead
                                className="px-1 py-2 md:px-3"
                                style={{ width: '95px', cursor: 'pointer' }}
                                onClick={() => toggleSort('value')}
                            >
                                Value {sortBy === 'value' && (sortDir === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead className="px-1 py-2 md:px-3" style={{ width: '75px' }} title="Relative performance vs nearby picks">
                                Rel
                            </TableHead>
                            <TableHead className="px-1 py-2 md:px-3" style={{ width: '30px' }}><span className="hidden md:inline">Stats</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSorted.map((item) => {
                            const isExpanded = expandedRows.has(item.playerId);
                            return (
                                <>
                                    <TableRow
                                        key={item.playerId}
                                        className="cursor-pointer hover:bg-steel/50 h-12"
                                        onClick={() => toggleRow(item.playerId)}
                                    >
                                        <TableCell className="px-1 py-2 md:px-3" style={{ width: '45px' }}>
                                            {pool_id == null ? item.adp.toFixed(1) : Math.floor(item.adp)}
                                        </TableCell>
                                        <TableCell
                                            className="px-2 py-2 max-w-[120px] md:max-w-[140px]"
                                            style={{
                                                fontWeight: 'bold',
                                                position: 'sticky',
                                                left: 0,
                                                background: '#1A1E25',
                                                zIndex: 1
                                            }}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] md:text-xs text-gray-400 w-5 md:w-8 flex-shrink-0">{item.position}</span>
                                                <span className="truncate text-xs sm:text-xs md:text-base">{item.name}</span>
                                            </div>
                                        </TableCell>
                                        {pool_id != null && (
                                            <TableCell className="px-1 py-2 md:px-3" style={{ width: '80px' }}>
                                                <span className="text-[10px] md:text-xs truncate block">{item.team}</span>
                                            </TableCell>
                                        )}
                                        {pool_id == null && (
                                            <TableCell className="px-1 py-2 justify-center flex max-h-12 h-12 xs:max-w-[40px] md:px-3" style={{ width: '60px' }}>
                                                <span className="text-[10px] md:text-xs text-gray-400 content-center">
                                                    {item.draftedInPoolCount < item.totalPoolsInRound ? `${item.min}-UD` : `${item.min}-${item.max}`}
                                                </span>
                                            </TableCell>
                                        )}
                                        <TableCell className="px-1 py-2 md:px-3" style={{ width: '60px' }}>
                                            <div className="flex flex-col gap-0.5 md:gap-1">
                                                <span className="font-bold">{item.points.toFixed(1)}</span>
                                                <div className="w-full bg-gray-700 h-0.5 md:h-1 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-cyan"
                                                        style={{ width: `${(item.points / maxPoints) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-1 py-2 md:px-3" style={{ width: '95px' }}>
                                            {item.scaledValue !== null ? (
                                                <div className="flex items-center gap-1 md:gap-3">
                                                    <span className="text-[9px] md:text-xs inline-block uppercase tracking-wide md:mr-2" style={{ width: '38px' }}>
                                                        {item.stars === 5 ? 'ELITE' : item.stars === 4 ? 'GREAT' : item.stars === 3 ? 'SOLID' : item.stars === 2 ? 'POOR' : 'BUST'}
                                                    </span>
                                                    <span className={`text-xs md:text-sm font-semibold ${getValueColor(item.scaledValue)}`}>
                                                        {item.scaledValue > 0 ? '+' : ''}{item.scaledValue.toFixed(0)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-1 py-2 md:px-3" style={{ width: '75px' }}>
                                            {item.relativeChart !== null ? (
                                                <span className="text-[10px] md:text-xs font-mono tracking-tighter md:tracking-tight">
                                                    {item.relativeChart.map((bar, idx) => {
                                                        let colorClass = '';
                                                        if (bar.isCurrent) {
                                                            colorClass = 'text-cyan';
                                                        } else if (bar.quintile !== null) {
                                                            colorClass = bar.quintile === 0 ? 'text-red-300' :
                                                                bar.quintile < 2 ? 'text-yellow-300' :
                                                                    bar.quintile < 5 ? 'text-green-300' :
                                                                        'text-purple-500';
                                                        }
                                                        return (
                                                            <span key={idx} className={colorClass}>
                                                                {bar.char}
                                                            </span>
                                                        );
                                                    })}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-1 py-2 md:px-3" style={{ width: '30px' }}>
                                            <span className="text-xs text-gray-400">
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                        <TableRow key={`${item.playerId}-stats`}>
                                            <TableCell colSpan={8} className="bg-steel/30">
                                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 p-3">
                                                    {statsKeys.map((key) => (
                                                        <div key={key} className="flex flex-col">
                                                            <span className="text-xs text-gray-400">
                                                                {mapStatNameShort(key)}
                                                            </span>
                                                            <span className="text-sm font-semibold">
                                                                {item.stats?.[key] ?? 0}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-3 text-xs text-gray-400">
                Showing {filteredAndSorted.length} of {summary.length} players
            </div>
        </div>
    );
}
