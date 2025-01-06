'use client';
import { useAppSelector } from '@/app/hooks';
import { Box, Center, Heading, Tabs, Text } from '@chakra-ui/react';
import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import DraftView from './draft';

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

    const items = [
        {
          title: "Teams",
          content: "Dolore ex esse laboris elit magna esse sunt",
        },
        {
          title: "Draft",
          content: <DraftView />
        },
      ]

    return (
        <Box maxW={'600px'} mx={'auto'} p={5}>
            <Heading as="h2" size="lg" pb="20px">
                {league.name}
            </Heading>
            <Text fontSize="md">League ID: {league.id}</Text>
            
            <Tabs.Root defaultValue="1" width="full">
                <Tabs.List>
                {items.map((item, index) => (
                    <Tabs.Trigger key={index} value={item.title}>
                    Tab {item.title}
                    </Tabs.Trigger>
                ))}
                </Tabs.List>
                <Box pos="relative" minH="200px" width="full">
                {items.map((item, index) => (
                    <Tabs.Content
                    key={index}
                    value={item.title}
                    position="absolute"
                    inset="0"
                    _open={{
                        animationName: "fade-in, scale-in",
                        animationDuration: "300ms",
                    }}
                    _closed={{
                        animationName: "fade-out, scale-out",
                        animationDuration: "120ms",
                    }}
                    >
                    {item.content}
                    </Tabs.Content>
                ))}
                </Box>
            </Tabs.Root>
        </Box>
    );
};

export default LeagueView;
