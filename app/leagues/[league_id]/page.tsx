'use client';
import { useAppSelector } from '@/app/hooks';
import { Box, Center, Heading, Text } from '@chakra-ui/react';
import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const LeagueView = () => {
    const router = useRouter();
    const { league_id } = useParams();
    const leagues = useAppSelector((state) => state.app.leagues);
    const [league, setLeague] = useState(null);

    useEffect(() => {
        if (leagues && league_id) {
            const foundLeague = leagues.find((l) => l.id === parseInt(league_id?.toString()));
            setLeague(foundLeague);
        }
    }, [leagues, league_id]);

    console.log(league_id);
    if (!league) {
        return (
            <Center>
                <Text>Loading...</Text>
            </Center>
        );
    }

    return (
        <Box maxW={'600px'} mx={'auto'} p={5}>
            <Heading as="h2" size="lg" pb="20px">
                {league.name}
            </Heading>
            <Text fontSize="md">League ID: {league.id}</Text>
            {/* Add more league details here as needed */}
        </Box>
    );
};

export default LeagueView;
