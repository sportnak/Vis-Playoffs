'use client';
import { useLeague, useUser } from '@/app/hooks';
import { Box, Button, Center, DialogTrigger, Heading, HStack, Table, Tabs, Text } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { usePools, useRounds } from './manage/hooks';
import { mapRound } from '@/utils';
import { Scoreboard } from '@/components/scoreboard';
import { useMember } from './draft/hooks';

export default function League() {
    const { league_id } = useParams();
    const { league } = useLeague(league_id as string);
    const { user } = useUser();
    const { rounds } = useRounds(league?.id);
    const { pools } = usePools(league?.id);

    const router = useRouter();

    const isAdmin = user?.id === league?.admin_id;

    const navigateDraft = useCallback(
        (round_id) => {
            router.push(`/leagues/${league_id}/draft/${round_id}`);
        },
        [league_id]
    );

    const navigateScoreboard = useCallback(
        (round_id) => {
            router.push(`/leagues/${league_id}/scoreboard/${round_id}`);
        },
        [league_id]
    );
    const items = useMemo(
        () => [
            {
                title: 'Draft',
                content: (
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>Round</Table.ColumnHeader>
                                <Table.ColumnHeader>Status</Table.ColumnHeader>
                                <Table.ColumnHeader></Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {rounds?.map((round) => (
                                <Table.Row key={round.id}>
                                    <Table.Cell>{mapRound(round.round)}</Table.Cell>
                                    <Table.Cell>{round.status}</Table.Cell>
                                    <Table.Cell w="40px">
                                        {round.status !== 'pending' ? (
                                            <Button
                                                disabled={
                                                    round.round_settings.length === 0 ||
                                                    pools.filter((x) => x.round_id === round.id).length === 0
                                                }
                                                onClick={() => navigateDraft(round.id)}
                                            >
                                                Draft
                                            </Button>
                                        ) : null}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )
            },
            {
                title: 'Scoreboard',
                content: (
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>Round</Table.ColumnHeader>
                                <Table.ColumnHeader>Status</Table.ColumnHeader>
                                <Table.ColumnHeader>Scoreboard</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {rounds?.map((round) => (
                                <Table.Row key={round.id}>
                                    <Table.Cell>{mapRound(round.round)}</Table.Cell>
                                    <Table.Cell>{round.status}</Table.Cell>
                                    <Table.Cell w="40px">
                                        {round.status === 'started' ? (
                                            <Button onClick={() => navigateScoreboard(round.id)}>Scoreboard</Button>
                                        ) : null}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )
            }
        ],
        [navigateDraft, navigateScoreboard, rounds, pools]
    );

    if (!league) {
        return (
            <Center>
                <Text>Loading...</Text>
            </Center>
        );
    }

    return (
        <Box maxW={'1000px'} mx={'auto'} p={5}>
            <HStack w="100%" justifyContent="space-between">
                <Heading as="h2" size="lg" pb="20px">
                    {league.name}
                </Heading>
                {isAdmin && (
                    <Button variant="solid" onClick={() => router.push(`/leagues/${league_id}/manage`)}>
                        Manage
                    </Button>
                )}
            </HStack>
            <Tabs.Root defaultValue="Draft" width="full">
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
