'use client';
import { useLeague, useUser } from '@/app/hooks';
import { Box, Center, Heading, HStack, Text } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRounds } from '../../manage/hooks';
import { Scoreboard } from '@/components/scoreboard';

const LeagueView = () => {
    const { league_id: leagueId, round: roundId } = useParams();
    const { league } = useLeague(leagueId.toString());
    const { user } = useUser();
    const { rounds } = useRounds(parseInt(leagueId as string));
    const currentRound = useMemo(() => {
        return rounds?.find((round) => round.id === parseInt(roundId as string));
    }, [rounds, roundId]);

    if (!league) {
        return (
            <Center>
                <Text>Loading...</Text>
            </Center>
        );
    }

    return (
        <Box maxW={'1000px'} mx={'auto'} p={5}>
            <HStack pb="20px" justifyContent={'space-between'}>
                <Link href={`/leagues/${league.id}`}>
                    <Heading as="h2" size="lg">
                        {'< '}
                        {league.name}
                    </Heading>
                </Link>
            </HStack>
            <Scoreboard league_id={league.id} round_id={currentRound?.id} />
        </Box>
    );
};

export default LeagueView;
