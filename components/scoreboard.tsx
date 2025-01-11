import { usePoints } from '@/app/leagues/[league_id]/hooks';
import { Team } from '@/app/types';
import { mapPos } from '@/app/util';
import { Box, Table, Button, Text, Heading, HStack } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { TeamCard } from './teams';
import { useAppSelector, useUser } from '@/app/hooks';
import { useDraft } from '@/app/leagues/[league_id]/draft/hooks';
import { useMemo } from 'react';
import { mapRound } from '@/utils';

export function Scoreboard({ league_id }) {
    const app = useAppSelector((state) => state.app);
    const { round_id, league, member, rounds, pools } = app;
    const currentRound = useMemo(() => {
        return rounds?.find((round) => round.id === round_id);
    }, [rounds, round_id]);

    const { teams, refresh } = usePoints(parseInt(league_id as string), round_id);
    const { teams: teamSeason } = usePoints(parseInt(league_id as string));

    return (
        <Box>
            <Heading mb="30px" fontWeight={300}>
                Round: {mapRound(currentRound?.round)}
            </Heading>
            <HStack justifyContent={'center'} flexWrap={'wrap'} gap={'20px'}>
                {teams
                    .sort(
                        (a, b) =>
                            totalPoints(teamSeason.find((t) => t.id === b.id)) -
                            totalPoints(teamSeason.find((t) => t.id === a.id))
                    )
                    .map((team) => {
                        const pool = pools.find(
                            (pool) => pool.draft_order.includes(team.id) && pool.round_id === currentRound?.id
                        );
                        return (
                            <Box
                                key={team.id}
                                bg={'rgba(255, 255, 255, 0.5)'}
                                p={5}
                                boxShadow={'sm'}
                                borderRadius="6px"
                                w="300px"
                            >
                                <HStack justifyContent={'space-between'}>
                                    <Heading fontSize="18px" fontWeight={100}>
                                        {team.name} ({totalPoints(teamSeason.find((t) => t.id === team.id))})
                                    </Heading>
                                    <Text>{totalPoints(team, pool?.id)}</Text>
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
                            </Box>
                        );
                    })}
            </HStack>
        </Box>
    );
}

function totalPoints(team: Team, pool_id?: number) {
    return (
        team?.team_players
            .filter((x) => !pool_id || x.pool_id === pool_id)
            .reduce((acc, player) => acc + player.score, 0) ?? 0
    );
}
