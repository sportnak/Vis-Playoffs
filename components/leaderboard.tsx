'use client';
import { usePoints } from '@/app/leagues/[league_id]/hooks';
import { Team, Pool, NFLRound, Member } from '@/app/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo, useEffect, useState } from 'react';
import { mapRound } from '@/utils';
import { createClient } from '@/utils/supabase/client';
import { useUIStore } from '@/stores/ui-store';
import { useLeagueStore } from '@/stores/league-store';
import { useUserStore } from '@/stores/user-store';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface TeamWithScores extends Team {
    seasonScore: number;
    poolScores: Record<string, number>;
}

interface LeaderboardEntry {
    rank: number;
    team: TeamWithScores;
    member: Member | undefined;
    totalPoints: number;
    poolWins: number;
    roundWins: number;
}

export function Leaderboard({ league_id }: { league_id: string }) {
    const round_id = useUIStore((state) => state.round_id);
    const rounds = useLeagueStore((state) => state.rounds);
    const pools = useLeagueStore((state) => state.pools);
    const league = useLeagueStore((state) => state.currentLeague);
    const member = useUserStore((state) => state.member);

    const currentRound = useMemo(() => {
        return rounds?.find((round) => round.id === round_id);
    }, [rounds, round_id]);

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

    const [selectedRoundForFilter, setSelectedRoundForFilter] = useState<string>(round_id);

    useEffect(() => {
        setSelectedRoundForFilter(round_id);
    }, [round_id]);

    // Sort teams by total score
    const sortedTeams = useMemo(() => {
        return [...teamSeason].sort((a, b) => b.seasonScore - a.seasonScore);
    }, [teamSeason]);

    // Calculate leaderboard entries with wins tracking
    const leaderboardEntries: LeaderboardEntry[] = useMemo(() => {
        return sortedTeams.map((team, index) => {
            const teamMember = league?.league_members?.find((m) => m.id === team.member_id);

            return {
                rank: index + 1,
                team,
                member: teamMember,
                totalPoints: team.seasonScore,
                poolWins: 0, // TODO: Calculate based on historical data
                roundWins: 0, // TODO: Calculate based on historical data
            };
        });
    }, [sortedTeams, league]);

    // Find top scorer for current round
    const topRoundScorer = useMemo(() => {
        if (sortedTeams.length === 0) return null;
        return leaderboardEntries[0];
    }, [leaderboardEntries]);

    // Find highest total score across all rounds
    const topOverallScorer = useMemo(() => {
        if (leaderboardEntries.length === 0) return null;
        return leaderboardEntries[0];
    }, [leaderboardEntries]);

    // Calculate pool leaders
    const poolLeaders = useMemo(() => {
        const leaders: Record<string, LeaderboardEntry> = {};

        currentRound?.pools?.forEach((pool) => {
            const poolTeams = leaderboardEntries
                .filter((entry) => entry.team.pool_id === pool.id)
                .sort((a, b) => {
                    const aScore = a.team.poolScores[pool.id] || 0;
                    const bScore = b.team.poolScores[pool.id] || 0;
                    return bScore - aScore;
                });

            if (poolTeams.length > 0) {
                leaders[pool.id] = poolTeams[0];
            }
        });

        return leaders;
    }, [leaderboardEntries, currentRound]);

    // Get user's rank and stats
    const userStats = useMemo(() => {
        if (!member) return null;
        const userEntry = leaderboardEntries.find((entry) => entry.member?.id === member.id);
        if (!userEntry) return null;

        const pointsFromLeader = topOverallScorer ? topOverallScorer.totalPoints - userEntry.totalPoints : 0;

        return {
            entry: userEntry,
            pointsFromLeader,
        };
    }, [leaderboardEntries, member, topOverallScorer]);

    // Group teams by pool
    const teamsByPool = useMemo(() => {
        const grouped: Record<string, LeaderboardEntry[]> = {};

        currentRound?.pools?.forEach((pool) => {
            grouped[pool.id] = leaderboardEntries
                .filter((entry) => entry.team.pool_id === pool.id)
                .sort((a, b) => {
                    const aScore = a.team.poolScores[pool.id] || 0;
                    const bScore = b.team.poolScores[pool.id] || 0;
                    return bScore - aScore;
                })
                .map((entry, index) => ({
                    ...entry,
                    rank: index + 1,
                }));
        });

        return grouped;
    }, [leaderboardEntries, currentRound]);

    const getInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    };

    const getRankBadgeVariant = (rank: number) => {
        if (rank === 1) return 'default';
        if (rank === 2) return 'secondary';
        if (rank === 3) return 'outline';
        return 'outline';
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
        if (rank === 3) return <Award className="h-4 w-4 text-amber-700" />;
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Top Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-ui-border">
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2 tracking-mono">
                            <Trophy className="h-4 w-4" />
                            HIGHEST TOTAL SCORE
                        </CardDescription>
                        <CardTitle className="text-2xl">
                            {topOverallScorer?.team.name || 'N/A'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{topOverallScorer?.totalPoints.toFixed(2) || '0.00'}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {topOverallScorer?.member?.email || 'Unknown'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-ui-border">
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2 tracking-mono">
                            <TrendingUp className="h-4 w-4" />
                            TOP SCORER - {mapRound(currentRound?.round).toUpperCase()}
                        </CardDescription>
                        <CardTitle className="text-2xl">
                            {topRoundScorer?.team.name || 'N/A'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{topRoundScorer?.totalPoints.toFixed(2) || '0.00'}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {topRoundScorer?.member?.email || 'Unknown'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-ui-border">
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2 tracking-mono">
                            <Award className="h-4 w-4" />
                            POOL LEADERS
                        </CardDescription>
                        <CardTitle className="text-2xl">
                            {Object.keys(poolLeaders).length} Pools
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {currentRound?.pools?.slice(0, 3).map((pool) => {
                                const leader = poolLeaders[pool.id];
                                return (
                                    <div key={pool.id} className="flex items-center justify-between text-sm">
                                        <Badge variant="outline" className="text-xs">
                                            {pool.name}
                                        </Badge>
                                        <span className="text-muted-foreground truncate ml-2">
                                            {leader?.team.name || 'N/A'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Personal Summary Card (if user has a team) */}
            {userStats && (
                <Card className="border-ui-border">
                    <CardHeader>
                        <CardTitle className="text-lg tracking-mono">YOUR PERFORMANCE</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground tracking-mono">RANK</p>
                                <p className="text-2xl font-bold">#{userStats.entry.rank}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground tracking-mono">TOTAL POINTS</p>
                                <p className="text-2xl font-bold">{userStats.entry.totalPoints.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground tracking-mono">FROM LEADER</p>
                                <p className="text-2xl font-bold text-orange-500">
                                    {userStats.pointsFromLeader > 0 ? `-${userStats.pointsFromLeader.toFixed(2)}` : '0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground tracking-mono">TEAM</p>
                                <p className="text-lg font-semibold truncate">{userStats.entry.team.name}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Leaderboard Tabs */}
            <Tabs defaultValue="overall" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overall">Overall</TabsTrigger>
                    <TabsTrigger value="by-pool">By Pool</TabsTrigger>
                    <TabsTrigger value="by-round">By Round</TabsTrigger>
                </TabsList>

                {/* Overall Tab */}
                <TabsContent value="overall" className="mt-6">
                    <Card className="border-ui-border">
                        <CardHeader>
                            <CardTitle className="tracking-mono">OVERALL LEADERBOARD</CardTitle>
                            <CardDescription>
                                <Tooltip content="Rankings based on total points scored across all rounds. Top 3 positions are highlighted.">
                                    <span className="cursor-help underline decoration-dotted">
                                        How rankings work
                                    </span>
                                </Tooltip>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16 tracking-mono">RANK</TableHead>
                                        <TableHead className="tracking-mono">PLAYER</TableHead>
                                        <TableHead className="tracking-mono">TEAM</TableHead>
                                        <TableHead className="text-right tracking-mono">TOTAL POINTS</TableHead>
                                        <TableHead className="text-right tracking-mono">POOL</TableHead>
                                        <TableHead className="text-center tracking-mono">ACHIEVEMENTS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaderboardEntries.map((entry) => (
                                        <TableRow
                                            key={entry.team.id}
                                            className={`
                                                ${entry.rank === 1 ? 'bg-yellow-500/5 border-l-4 border-l-yellow-500' : ''}
                                                ${entry.rank === 2 ? 'bg-gray-400/5 border-l-4 border-l-gray-400' : ''}
                                                ${entry.rank === 3 ? 'bg-amber-700/5 border-l-4 border-l-amber-700' : ''}
                                                ${entry.member?.id === member?.id ? 'bg-frost/5' : ''}
                                            `}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {getRankIcon(entry.rank)}
                                                    <span className={entry.rank <= 3 ? 'font-bold text-lg' : ''}>
                                                        {entry.rank}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials(entry.member?.email || '??')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className={entry.rank <= 3 ? 'font-semibold' : ''}>
                                                        {entry.member?.email || 'Unknown'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={entry.rank <= 3 ? 'font-semibold' : ''}>
                                                {entry.team.name}
                                            </TableCell>
                                            <TableCell className={`text-right ${entry.rank <= 3 ? 'font-bold text-lg' : 'font-semibold'}`}>
                                                {entry.totalPoints.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline">
                                                    {pools?.find((p) => p.id === entry.team.pool_id)?.name || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-1">
                                                    {entry.roundWins > 0 && (
                                                        <Tooltip content={`${entry.roundWins} Round Wins`}>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {entry.roundWins}R
                                                            </Badge>
                                                        </Tooltip>
                                                    )}
                                                    {entry.poolWins > 0 && (
                                                        <Tooltip content={`${entry.poolWins} Pool Wins`}>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {entry.poolWins}P
                                                            </Badge>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* By Pool Tab */}
                <TabsContent value="by-pool" className="mt-6">
                    <Card className="border-ui-border">
                        <CardHeader>
                            <CardTitle className="tracking-mono">LEADERBOARD BY POOL</CardTitle>
                            <CardDescription>
                                <Tooltip content="Each pool has its own draft and rankings. Expand to see standings within each pool.">
                                    <span className="cursor-help underline decoration-dotted">
                                        About pools
                                    </span>
                                </Tooltip>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full">
                                {currentRound?.pools?.map((pool) => {
                                    const poolTeams = teamsByPool[pool.id] || [];
                                    const leader = poolTeams[0];

                                    return (
                                        <AccordionItem key={pool.id} value={pool.id} className="border-ui-border">
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex items-center justify-between w-full pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="default">{pool.name}</Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            {poolTeams.length} teams
                                                        </span>
                                                    </div>
                                                    {leader && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Trophy className="h-4 w-4 text-yellow-500" />
                                                            <span className="font-semibold">{leader.team.name}</span>
                                                            <span className="text-muted-foreground">
                                                                {leader.team.poolScores[pool.id]?.toFixed(2) || '0.00'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-16 tracking-mono">RANK</TableHead>
                                                            <TableHead className="tracking-mono">PLAYER</TableHead>
                                                            <TableHead className="tracking-mono">TEAM</TableHead>
                                                            <TableHead className="text-right tracking-mono">POOL POINTS</TableHead>
                                                            <TableHead className="text-right tracking-mono">TOTAL POINTS</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {poolTeams.map((entry) => (
                                                            <TableRow
                                                                key={entry.team.id}
                                                                className={`
                                                                    ${entry.rank === 1 ? 'bg-yellow-500/5' : ''}
                                                                    ${entry.rank === 2 ? 'bg-gray-400/5' : ''}
                                                                    ${entry.rank === 3 ? 'bg-amber-700/5' : ''}
                                                                `}
                                                            >
                                                                <TableCell className="font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                        {entry.rank <= 3 && getRankIcon(entry.rank)}
                                                                        <span className={entry.rank <= 3 ? 'font-bold' : ''}>
                                                                            {entry.rank}
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarFallback className="text-xs">
                                                                                {getInitials(entry.member?.email || '??')}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        {entry.member?.email || 'Unknown'}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>{entry.team.name}</TableCell>
                                                                <TableCell className="text-right font-semibold">
                                                                    {entry.team.poolScores[pool.id]?.toFixed(2) || '0.00'}
                                                                </TableCell>
                                                                <TableCell className="text-right text-muted-foreground">
                                                                    {entry.totalPoints.toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* By Round Tab */}
                <TabsContent value="by-round" className="mt-6">
                    <Card className="border-ui-border">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="tracking-mono">LEADERBOARD BY ROUND</CardTitle>
                                    <CardDescription>
                                        <Tooltip content="View standings for a specific playoff round. Select a round to see its leaderboard.">
                                            <span className="cursor-help underline decoration-dotted">
                                                Round selection
                                            </span>
                                        </Tooltip>
                                    </CardDescription>
                                </div>
                                <Select value={selectedRoundForFilter} onValueChange={setSelectedRoundForFilter}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select round" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rounds?.map((round) => (
                                            <SelectItem key={round.id} value={round.id}>
                                                {mapRound(round.round)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16 tracking-mono">RANK</TableHead>
                                        <TableHead className="tracking-mono">PLAYER</TableHead>
                                        <TableHead className="tracking-mono">TEAM</TableHead>
                                        <TableHead className="text-right tracking-mono">ROUND POINTS</TableHead>
                                        <TableHead className="text-right tracking-mono">POOL</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaderboardEntries.map((entry) => (
                                        <TableRow
                                            key={entry.team.id}
                                            className={`
                                                ${entry.rank === 1 ? 'bg-yellow-500/5 border-l-4 border-l-yellow-500' : ''}
                                                ${entry.rank === 2 ? 'bg-gray-400/5 border-l-4 border-l-gray-400' : ''}
                                                ${entry.rank === 3 ? 'bg-amber-700/5 border-l-4 border-l-amber-700' : ''}
                                            `}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {getRankIcon(entry.rank)}
                                                    <span className={entry.rank <= 3 ? 'font-bold text-lg' : ''}>
                                                        {entry.rank}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials(entry.member?.email || '??')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className={entry.rank <= 3 ? 'font-semibold' : ''}>
                                                        {entry.member?.email || 'Unknown'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={entry.rank <= 3 ? 'font-semibold' : ''}>
                                                {entry.team.name}
                                            </TableCell>
                                            <TableCell className={`text-right ${entry.rank <= 3 ? 'font-bold text-lg' : 'font-semibold'}`}>
                                                {entry.totalPoints.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline">
                                                    {pools?.find((p) => p.id === entry.team.pool_id)?.name || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
