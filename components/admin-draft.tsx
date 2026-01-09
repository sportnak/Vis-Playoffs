'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { P } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { adminDraftPlayer, loadPool, loadTeams, loadNFLPlayers } from '@/actions/league';
import { Pool, Team } from '@/app/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MdOutlineSearch } from 'react-icons/md';
import { toast } from '@/components/ui/toaster';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Teams, { TeamCard } from '@/components/teams';
import { useLeagueStore } from '@/stores/league-store';

const positions = [
    { value: 'ALL', label: 'ALL' },
    { value: 'QB', label: 'QB' },
    { value: 'RB', label: 'RB' },
    { value: 'WR', label: 'WR' },
    { value: 'TE', label: 'TE' },
    { value: 'FLEX', label: 'FLEX' },
    { value: 'SF', label: 'SF' }
];

export function AdminDraft({ leagueId, roundId }) {
    const rounds = useLeagueStore((state) => state.rounds);

    const [pools, setPools] = useState<Pool[]>([]);
    const [teams, setTeams] = useState<{ [key: string]: Team[] }>({});
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [positionFilter, setPositionFilter] = useState('ALL');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [innerWidth, setInnerWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleResize = () => setInnerWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = innerWidth < 768;
    const currentRound = rounds?.find((round) => round.id === roundId);

    const loadPoolsAndTeams = useCallback(async () => {
        if (!leagueId || !roundId) return;

        const poolResponse = await loadPool(roundId, leagueId.toString());
        if (poolResponse.data) {
            setPools(poolResponse.data);

            const teamsByPool: { [key: string]: Team[] } = {};
            for (const pool of poolResponse.data) {
                if (pool.draft_order && pool.draft_order.length > 0) {
                    const teamsResponse = await loadTeams({ pool_ids: [pool.id] });
                    teamsByPool[pool.id] = teamsResponse || [];
                }
            }
            setTeams(teamsByPool);
        }
    }, [leagueId, roundId]);

    const loadAvailablePlayers = useCallback(() => {
        if (!selectedPool || !roundId) return;

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        searchDebounceRef.current = setTimeout(async () => {
            const response = await loadNFLPlayers(
                {
                    drafted: false,
                    pos: positionFilter === 'ALL' ? 'SF' : positionFilter,
                    name: searchQuery,
                    round_id: roundId
                },
                selectedPool.id,
                leagueId.toString()
            );

            if (response.data) {
                setPlayers(response.data);
            }
        }, 750);
    }, [selectedPool, roundId, leagueId, positionFilter, searchQuery]);

    useEffect(() => {
        loadPoolsAndTeams();
    }, [loadPoolsAndTeams]);

    useEffect(() => {
        if (selectedPool) {
            loadAvailablePlayers();
        }
        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [loadAvailablePlayers, selectedPool]);

    const handleDraftPlayer = useCallback(async () => {
        if (!selectedPool || !selectedPlayer || !leagueId || !roundId) {
            return;
        }

        setLoading(true);

        const response = await adminDraftPlayer(
            leagueId.toString(),
            roundId,
            selectedPool.id,
            selectedPlayer.id
        );

        if (response.error) {
            toast.error(response.error.message);
        } else {
            toast.success(`Successfully drafted ${selectedPlayer.name}`);
            setSelectedPlayer(null);
            setDialogOpen(false);
            await loadPoolsAndTeams();

            const updatedPools = await loadPool(roundId, leagueId.toString());
            if (updatedPools.data) {
                const updatedPool = updatedPools.data.find(p => p.id === selectedPool.id);
                if (updatedPool) {
                    setSelectedPool(updatedPool);
                }
            }

            loadAvailablePlayers();
        }

        setLoading(false);
    }, [selectedPool, selectedPlayer, leagueId, roundId, loadPoolsAndTeams, loadAvailablePlayers]);

    if (!roundId) {
        return (
            <div className="flex justify-center p-8">
                <P className="text-cool-gray tracking-mono">Please select a round to begin admin drafting</P>
            </div>
        );
    }

    const currentTeam = selectedPool && teams[selectedPool.id]
        ? teams[selectedPool.id].find(t => t.id === selectedPool.current)
        : null;

    const DialogComponent = (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="p-0">
                    <DialogHeader className="px-4 py-4 border-b border-ui-border">
                        <DialogTitle className="tracking-mono text-sm">DRAFT: {selectedPlayer?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="px-4 pb-4 space-y-3 border-b border-ui-border">
                        <div className="flex justify-between items-center">
                            <span className="text-cool-gray tracking-mono text-xs">POSITION:</span>
                            <span className="text-frost font-medium">{selectedPlayer?.position}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-cool-gray tracking-mono text-xs">NFL TEAM:</span>
                            <span className="text-frost font-medium">{selectedPlayer?.nfl_team?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-cool-gray tracking-mono text-xs">DRAFTING TEAM:</span>
                            <span className="text-frost font-medium">{currentTeam?.name}</span>
                        </div>
                    </div>
                    <DialogFooter className="pb-4 px-4">
                        <DialogClose asChild>
                            <Button variant="outline" className="font-roboto-mono tracking-button" size="sm">CANCEL</Button>
                        </DialogClose>
                        <Button
                            variant="default"
                            className="font-roboto-mono tracking-button"
                            size="sm"
                            onClick={handleDraftPlayer}
                            disabled={loading}
                        >
                            {loading ? 'DRAFTING...' : 'CONFIRM'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
        </Dialog>
    );

    if (isMobile) {
        return (
            <div className="w-full mx-auto">
                {DialogComponent}
                <Tabs defaultValue="pools">
                    <TabsList className="w-full">
                        <TabsTrigger value="pools" className="flex-1 text-xs">Pools</TabsTrigger>
                        <TabsTrigger value="draft" className="flex-1 text-xs">Draft</TabsTrigger>
                        <TabsTrigger value="teams" className="flex-1 text-xs">Teams</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pools" className="mt-2">
                        <div className="bg-steel border border-ui-border shadow-md rounded-md">
                            <P className="py-2 px-4 border-b border-ui-border font-light font-roboto-mono tracking-[0.025rem] text-sm">
                                DRAFT POOLS
                            </P>
                            <div className="p-2 space-y-2">
                                {pools.length === 0 ? (
                                    <P className="text-center text-cool-gray">No active draft pools</P>
                                ) : (
                                    pools.map(pool => {
                                        const poolTeams = teams[pool.id] || [];
                                        const currentTeamInPool = poolTeams.find(t => t.id === pool.current);
                                        const isDrafting = pool.status === 'drafting';

                                        return (
                                            <div
                                                key={pool.id}
                                                className={`border rounded p-3 cursor-pointer transition-colors ${
                                                    selectedPool?.id === pool.id
                                                        ? 'border-frost bg-polar-night'
                                                        : 'border-ui-border hover:border-cool-gray'
                                                }`}
                                                onClick={() => setSelectedPool(pool)}
                                            >
                                                <div className="space-y-1">
                                                    <P className="font-semibold font-roboto-mono text-sm">{pool.name}</P>
                                                    <P className="text-xs text-cool-gray tracking-mono">
                                                        {isDrafting ? '● DRAFTING' : '✓ COMPLETE'}
                                                    </P>
                                                    {isDrafting && currentTeamInPool && (
                                                        <P className="text-xs text-frost tracking-mono">
                                                            ON CLOCK: {currentTeamInPool.name}
                                                        </P>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {selectedPool && currentTeam && teams[selectedPool.id] && (
                                <div className="mt-2 p-2">
                                    <Teams
                                        pool={selectedPool}
                                        dropPlayer={() => {}}
                                        teams={teams[selectedPool.id]}
                                        round={currentRound}
                                        memberId={currentTeam.member_id}
                                    />
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="draft" className="mt-2">
                        {!selectedPool ? (
                            <div className="p-8 bg-steel border border-ui-border rounded-md flex justify-center">
                                <P className="text-cool-gray tracking-mono text-xs">Select a pool first</P>
                            </div>
                        ) : selectedPool.status === 'complete' ? (
                            <div className="p-8 bg-steel border border-ui-border rounded-md flex justify-center">
                                <P className="text-cool-gray tracking-mono text-xs">Pool completed</P>
                            </div>
                        ) : !currentTeam ? (
                            <div className="p-8 bg-steel border border-ui-border rounded-md flex justify-center">
                                <P className="text-cool-gray tracking-mono text-xs">No team on clock</P>
                            </div>
                        ) : (
                            <div className="bg-steel border border-ui-border shadow-md rounded-md">
                                <P className="py-2 px-4 border-b border-ui-border font-light font-roboto-mono tracking-[0.025rem] text-sm">
                                    DRAFT PLAYER
                                </P>
                                <div className="p-2 space-y-2">
                                    <Select value={positionFilter} onValueChange={setPositionFilter}>
                                        <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue placeholder="POS..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {positions.map((pos) => (
                                                <SelectItem key={pos.value} value={pos.value}>
                                                    {pos.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Search players..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 h-8 text-xs"
                                        />
                                        <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cool-gray" size={16} />
                                    </div>
                                </div>

                                <div className="overflow-auto max-h-[400px]">
                                    {players.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <P className="text-cool-gray text-xs">No players found</P>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 p-2">
                                            {players.map(player => (
                                                <div
                                                    key={player.id}
                                                    className="border border-ui-border rounded p-2 cursor-pointer hover:bg-polar-night"
                                                    onClick={() => {
                                                        setSelectedPlayer(player);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <P className="font-medium text-xs">{player.name}</P>
                                                            <P className="text-xs text-cool-gray">{player.position} - {player.nfl_team?.abbreviation}</P>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="h-7 text-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedPlayer(player);
                                                                setDialogOpen(true);
                                                            }}
                                                        >
                                                            DRAFT
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="teams" className="mt-2">
                        {!selectedPool ? (
                            <div className="p-8 bg-steel border border-ui-border rounded-md flex justify-center">
                                <P className="text-cool-gray tracking-mono text-xs">Select a pool first</P>
                            </div>
                        ) : (
                            <div className="bg-steel border border-ui-border shadow-md rounded-md">
                                <P className="py-2 px-4 border-b border-ui-border font-light font-roboto-mono tracking-[0.025rem] text-sm">
                                    ALL TEAMS
                                </P>
                                <div className="p-2 space-y-3">
                                    {teams[selectedPool.id]?.map(team => (
                                        <div key={team.id} className="border border-ui-border rounded-md bg-polar-night/30">
                                            <div className="px-3 py-2 border-b border-ui-border">
                                                <P className="font-semibold font-roboto-mono text-xs">{team.name}</P>
                                            </div>
                                            <div className="p-3">
                                                <TeamCard
                                                    showScore={false}
                                                    team={team}
                                                    round={currentRound}
                                                    pool={selectedPool}
                                                    memberId={team.member_id}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto space-y-6">
            {DialogComponent}

            <div className="flex w-full items-start gap-8">
                <div className="flex-[2]">
                    <div className="bg-steel border border-ui-border shadow-md rounded-md">
                        <P className="py-2 px-4 border-b border-ui-border font-light font-roboto-mono tracking-[0.025rem] text-sm">
                            DRAFT POOLS
                        </P>
                        <div className="p-4 space-y-2">
                            {pools.length === 0 ? (
                                <P className="text-center text-cool-gray">No active draft pools</P>
                            ) : (
                                pools.map(pool => {
                                    const poolTeams = teams[pool.id] || [];
                                    const currentTeamInPool = poolTeams.find(t => t.id === pool.current);
                                    const isDrafting = pool.status === 'drafting';

                                    return (
                                        <div
                                            key={pool.id}
                                            className={`border rounded p-3 cursor-pointer transition-colors ${
                                                selectedPool?.id === pool.id
                                                    ? 'border-frost bg-polar-night'
                                                    : 'border-ui-border hover:border-cool-gray'
                                            }`}
                                            onClick={() => setSelectedPool(pool)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <P className="font-semibold font-roboto-mono text-sm">{pool.name}</P>
                                                    <P className="text-xs text-cool-gray tracking-mono">
                                                        {isDrafting ? '● DRAFTING' : '✓ COMPLETE'}
                                                    </P>
                                                    {isDrafting && currentTeamInPool && (
                                                        <P className="text-xs text-frost tracking-mono">
                                                            ON CLOCK: {currentTeamInPool.name}
                                                        </P>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {selectedPool && currentTeam && teams[selectedPool.id] && (
                        <div className="mt-4">
                            <Teams
                                pool={selectedPool}
                                dropPlayer={() => {}}
                                teams={teams[selectedPool.id]}
                                round={currentRound}
                                memberId={currentTeam.member_id}
                            />
                        </div>
                    )}
                </div>

                <div className="flex-[5] bg-steel shadow-md rounded-xl border border-ui-border">
                    <P className="py-2 px-4 border-b border-ui-border font-light font-roboto-mono tracking-[0.025rem] text-sm">
                        DRAFT PLAYER
                    </P>

                    {!selectedPool ? (
                        <div className="p-8 flex justify-center">
                            <P className="text-cool-gray tracking-mono">Select a pool to begin drafting</P>
                        </div>
                    ) : selectedPool.status === 'complete' ? (
                        <div className="p-8 flex justify-center">
                            <P className="text-cool-gray tracking-mono">This pool has completed drafting</P>
                        </div>
                    ) : !currentTeam ? (
                        <div className="p-8 flex justify-center">
                            <P className="text-cool-gray tracking-mono">No team currently on the clock</P>
                        </div>
                    ) : (
                        <div>
                            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex flex-wrap gap-3 items-center w-full">
                                    <Select value={positionFilter} onValueChange={setPositionFilter}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="POS..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {positions.map((pos) => (
                                                <SelectItem key={pos.value} value={pos.value}>
                                                    {pos.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="relative flex-1">
                                        <Input
                                            type="text"
                                            placeholder="Search players..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                        <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cool-gray" size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-auto max-h-[600px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%]">PLAYER</TableHead>
                                            <TableHead>POS</TableHead>
                                            <TableHead>TEAM</TableHead>
                                            <TableHead className="text-right">ACTION</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {players.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-cool-gray">
                                                    No players found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            players.map(player => (
                                                <TableRow
                                                    key={player.id}
                                                    className="cursor-pointer hover:bg-polar-night"
                                                    onClick={() => {
                                                        setSelectedPlayer(player);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <TableCell className="font-medium">{player.name}</TableCell>
                                                    <TableCell>{player.position}</TableCell>
                                                    <TableCell>{player.nfl_team?.abbreviation}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedPlayer(player);
                                                                setDialogOpen(true);
                                                            }}
                                                        >
                                                            DRAFT
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedPool && teams[selectedPool.id] && teams[selectedPool.id].length > 0 && (
                <div className="w-full">
                    <div className="bg-steel border border-ui-border shadow-md rounded-md">
                        <P className="py-2 px-4 border-b border-ui-border font-light font-roboto-mono tracking-[0.025rem] text-sm">
                            ALL TEAMS
                        </P>
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teams[selectedPool.id].map(team => (
                                    <div key={team.id} className="border border-ui-border rounded-md bg-polar-night/30 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-ui-border bg-steel/50">
                                            <P className="font-semibold font-roboto-mono text-sm">{team.name}</P>
                                        </div>
                                        <div className="p-4">
                                            <TeamCard
                                                showScore={false}
                                                team={team}
                                                round={currentRound}
                                                pool={selectedPool}
                                                memberId={team.member_id}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
