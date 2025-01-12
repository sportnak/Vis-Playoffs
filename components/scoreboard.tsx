import { usePoints } from '@/app/leagues/[league_id]/hooks';
import { Team } from '@/app/types';
import { mapPos } from '@/app/util';
import { Box, Table, Button, Text, Heading, HStack, VStack } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { TeamCard } from './teams';
import { useAppSelector, useUser } from '@/app/hooks';
import { useDraft } from '@/app/leagues/[league_id]/draft/hooks';
import { useMemo } from 'react';
import { mapRound } from '@/utils';
import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRef } from 'react';
import { DialogContent, DialogRoot, DialogTrigger } from './ui/dialog';
import { useState } from 'react';

export function Scoreboard({ league_id }) {
    const app = useAppSelector((state) => state.app);
    const { round_id, league, member, rounds, pools } = app;
    const currentRound = useMemo(() => {
        return rounds?.find((round) => round.id === round_id);
    }, [rounds, round_id]);

    const { teams: teamSeason, refresh: refreshTeam } = usePoints(parseInt(league_id as string));

    useEffect(() => {
        const handleInserts = (payload) => {
            refreshTeam();
        };

        const client = createClient();
        const channel = client.channel('supabase_realtime');
        // Listen to inserts
        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stats' }, handleInserts)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stats' }, handleInserts)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stats' }, handleInserts)
            .subscribe();

        return () => {
            client.removeChannel(channel);
        };
    }, [refreshTeam]);
    const [showSummary, setShowSummary] = useState(false);
    const sortedTeams = useMemo(() => {
        return teamSeason.sort((a, b) => b.seasonScore - a.seasonScore);
    }, [teamSeason]);

    return (
        <Box>
            <VStack ml="12px" alignItems={'flex-start'} mb="30px">
                <Heading fontWeight={300}>Round: {mapRound(currentRound?.round)}</Heading>
                <Button onClick={() => setShowSummary(!showSummary)} mr="20px" variant="subtle" height="30px">
                    {showSummary ? 'Scores' : 'Draft Summary'}
                </Button>
            </VStack>

            {showSummary ? (
                <DraftSummary teams={teamSeason} />
            ) : (
                <HStack justifyContent={'center'} flexWrap={'wrap'} gap={'20px'}>
                    {sortedTeams.map((team) => {
                        const pool = pools.find(
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
                        return (
                            <Box
                                key={team.id}
                                bg={'rgba(255, 255, 255, 0.5)'}
                                p={5}
                                boxShadow={'sm'}
                                borderRadius="6px"
                                w="300px"
                            >
                                <VStack alignItems={'flex-start'} flexWrap={'wrap'} justifyContent={'space-between'}>
                                    <HStack>
                                        <Heading fontSize="18px" fontWeight={100} truncate>
                                            {team.name}
                                        </Heading>
                                        <Text fontSize="12px">({team.seasonScore})</Text>
                                    </HStack>
                                    <Text fontSize="12px">
                                        {Object.entries(playerCounts)
                                            .map(([key, value]) => `${key}: ${value}`)
                                            .join(', ')}
                                    </Text>
                                </VStack>
                                <HStack>
                                    <Text
                                        fontSize="12px"
                                        color={
                                            avg < -20
                                                ? '#f94144'
                                                : avg < -10
                                                  ? '#f9844a'
                                                  : avg < -5
                                                    ? '#90be6d'
                                                    : '#277da1'
                                        }
                                    >
                                        Points Back: {pointsBack}
                                    </Text>
                                </HStack>
                                <Text mb={'10px'} fontSize={'10px'}>
                                    Pool: {pool?.name}
                                </Text>
                                <TeamCard
                                    showScore
                                    team={team}
                                    round={currentRound}
                                    pool={pool}
                                    memberId={member?.id}
                                />
                                <HStack fontSize="14px" mt="10px" justifyContent={'flex-end'}>
                                    <Text>Round Score:</Text>
                                    <Text fontWeight="bold">{parseFloat(team.poolScores[pool?.id].toFixed(2))}</Text>
                                </HStack>
                            </Box>
                        );
                    })}
                </HStack>
            )}
        </Box>
    );
}

function totalPoints(team: Team, pool_id?: number) {
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

function DraftSummary({ teams }) {
    const summary = useMemo(() => {
        const grouped = teams.reduce((acc, team) => {
            for (const player of team.team_players) {
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
                points: players[0].score,
                stats: players[0].stats,
                min: Math.min(...pos),
                max: Math.max(...pos),
                name: players[0].player.name
            });
        }
        summaries.sort((a, b) => a.adp - b.adp);
        return summaries;
    }, [teams]);

    return (
        <Box width="100%" maxH="100vh" overflow={'scroll'}>
            <Table.Root width="100%">
                <Table.Header>
                    <Table.Row style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2 }}>
                        <Table.ColumnHeader
                            style={{ width: '120px', position: 'sticky', left: 0, background: 'white', zIndex: 1 }}
                        >
                            Name
                        </Table.ColumnHeader>
                        <Table.ColumnHeader style={{ width: '40px' }}>ADP</Table.ColumnHeader>
                        <Table.ColumnHeader style={{ width: '40px' }}>Min</Table.ColumnHeader>
                        <Table.ColumnHeader style={{ width: '40px' }}>Max</Table.ColumnHeader>
                        <Table.ColumnHeader style={{ width: '40px' }}>Points</Table.ColumnHeader>
                        {statsKeys.map((key) => (
                            <Table.ColumnHeader key={key}>{mapStatNameShort(key)}</Table.ColumnHeader>
                        ))}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {summary.map((item, index) => (
                        <Table.Row key={index}>
                            <Table.Cell
                                style={{
                                    fontWeight: 'bold',
                                    width: '120px',
                                    position: 'sticky',
                                    left: 0,
                                    background: 'white',
                                    zIndex: 1
                                }}
                            >
                                {item.name}
                            </Table.Cell>
                            <Table.Cell style={{ width: '40px' }}>{item.adp.toFixed(2)}</Table.Cell>
                            <Table.Cell style={{ width: '40px' }}>{item.min}</Table.Cell>
                            <Table.Cell style={{ width: '40px' }}>{item.max}</Table.Cell>
                            <Table.Cell style={{ width: '40px' }}>{item.points}</Table.Cell>
                            {statsKeys.map((key) => (
                                <Table.Cell key={key}>{item.stats?.[key] ?? 0}</Table.Cell>
                            ))}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}
