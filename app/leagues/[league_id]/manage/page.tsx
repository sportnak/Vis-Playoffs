'use client';
import { useLeague, useUser } from '@/app/hooks';
import MembersTable from '@/components/members';
import { Box, Button, Center, Heading, Tabs, Text } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { useMembers, useRounds } from './hooks';
import Rounds from '@/components/rounds';

export default function ManageLeague() {
    const { user } = useUser();
    const { league_id } = useParams();
    const { league } = useLeague(league_id.toString());
    const router = useRouter();

    const { members } = useMembers(league?.id);
    const { rounds } = useRounds();

    const items = useMemo(
        () => [
            {
                title: 'Rounds',
                content: <Rounds rounds={rounds} leagueId={league?.id} />
            },
            {
                title: 'Members',
                content: <MembersTable members={members} league_id={league?.id} />
            }
        ],
        [members, league, rounds]
    );

    const handleLeagueHome = useCallback(() => {
        router.push(`/leagues/${league_id}`);
    }, [league_id]);

    if (!league || !user) {
        return (
            <Center>
                <Text>Loading...</Text>
            </Center>
        );
    }

    if (league.admin_id !== user?.id) {
        router.push(`/leagues/${league_id}`);
        return;
    }

    return (
        <Box maxW={'1000px'} mx={'auto'} p={5}>
            <Heading as="h2" size="lg" pb="20px">
                <Button variant="plain" fontSize="md" onClick={handleLeagueHome}>
                    {'<'}
                </Button>
                {league.name} Settings
            </Heading>

            <Tabs.Root defaultValue="Rounds" width="full">
                <Tabs.List>
                    {items.map((item, index) => (
                        <Tabs.Trigger key={index} value={item.title}>
                            {item.title}
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
                                animationName: 'fade-in, scale-in',
                                animationDuration: '300ms'
                            }}
                            _closed={{
                                animationName: 'fade-out, scale-out',
                                animationDuration: '120ms'
                            }}
                        >
                            {item.content}
                        </Tabs.Content>
                    ))}
                </Box>
            </Tabs.Root>
        </Box>
    );
}
