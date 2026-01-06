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
    round_id?: string;
    pool_id?: string | null;
}

export function DraftSummary({ teams, pools, round_id, pool_id }: DraftSummaryProps) {
    const [sortBy, setSortBy] = useState<'adp' | 'points' | 'value'>('adp');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [posFilter, setPosFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

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
                name: players[0].player.name,
                position: mapPos(players[0].player),
                playerId
            });
        }

        return summaries;
    }, [teams, pools, round_id, pool_id, teams_by_id, pools_by_round]);

    const filteredAndSorted = useMemo(() => {
        let filtered = summary;

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
                const aValue = a.points / a.adp;
                const bValue = b.points / b.adp;
                comparison = bValue - aValue;
            }
            return sortDir === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [summary, posFilter, searchQuery, sortBy, sortDir]);

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
        const posSet = new Set(summary.map((x) => x.position));
        return ['all', ...Array.from(posSet).sort()];
    }, [summary]);

    const getValueColor = (points: number, adp: number) => {
        const value = points / adp;
        const avgValue = summary.reduce((acc, x) => acc + x.points / x.adp, 0) / summary.length;
        const diff = ((value - avgValue) / avgValue) * 100;

        if (diff > 20) return 'text-semantic-good';
        if (diff > 0) return 'text-cyan';
        if (diff > -20) return 'text-semantic-warning';
        return 'text-semantic-danger';
    };

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
                <Table className="w-full">
                    <TableHeader>
                        <TableRow style={{ position: 'sticky', top: 0, background: '#1A1E25', zIndex: 2 }}>
                            <TableHead
                                style={{ width: '200px', position: 'sticky', left: 0, background: '#1A1E25', zIndex: 3 }}
                            >
                                Player
                            </TableHead>
                            <TableHead
                                style={{ width: '60px', cursor: 'pointer' }}
                                onClick={() => toggleSort('adp')}
                            >
                                {pool_id == null ? 'ADP' : 'Pick'} {sortBy === 'adp' && (sortDir === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            {pool_id != null && <TableHead style={{ width: '100px' }}>Team</TableHead>}
                            {pool_id == null && <TableHead style={{ width: '80px' }}>Range</TableHead>}
                            <TableHead
                                style={{ width: '80px', cursor: 'pointer' }}
                                onClick={() => toggleSort('points')}
                            >
                                Points {sortBy === 'points' && (sortDir === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead
                                style={{ width: '100px', cursor: 'pointer' }}
                                onClick={() => toggleSort('value')}
                            >
                                Value {sortBy === 'value' && (sortDir === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead style={{ width: '60px' }}>Stats</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSorted.map((item) => {
                            const isExpanded = expandedRows.has(item.playerId);
                            return (
                                <>
                                    <TableRow
                                        key={item.playerId}
                                        className="cursor-pointer hover:bg-steel/50"
                                        onClick={() => toggleRow(item.playerId)}
                                    >
                                        <TableCell
                                            style={{
                                                fontWeight: 'bold',
                                                width: '200px',
                                                position: 'sticky',
                                                left: 0,
                                                background: '#1A1E25',
                                                zIndex: 1
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 w-8">{item.position}</span>
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ width: '60px' }}>
                                            {pool_id == null ? item.adp.toFixed(1) : Math.floor(item.adp)}
                                        </TableCell>
                                        {pool_id != null && (
                                            <TableCell style={{ width: '100px' }}>
                                                <span className="text-xs">{item.team}</span>
                                            </TableCell>
                                        )}
                                        {pool_id == null && (
                                            <TableCell style={{ width: '80px' }}>
                                                <span className="text-xs text-gray-400">
                                                    {item.min}-{item.max}
                                                </span>
                                            </TableCell>
                                        )}
                                        <TableCell style={{ width: '80px' }}>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold">{item.points.toFixed(1)}</span>
                                                <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-cyan"
                                                        style={{ width: `${(item.points / maxPoints) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell style={{ width: '100px' }}>
                                            <span className={`text-sm font-semibold ${getValueColor(item.points, item.adp)}`}>
                                                {(item.points / item.adp).toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell style={{ width: '60px' }}>
                                            <span className="text-xs text-gray-400">
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                        <TableRow key={`${item.playerId}-stats`}>
                                            <TableCell colSpan={7} className="bg-steel/30">
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
