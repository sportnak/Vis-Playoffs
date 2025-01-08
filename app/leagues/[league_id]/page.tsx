'use client';
import { useLeague, useUser } from '@/app/hooks';
import { Box, Button, Center, DialogTrigger, Heading, HStack, Table, Text } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback } from 'react';
import { useRounds } from './manage/hooks';
import { mapRound } from '@/utils';

export default function League() {
    const { league_id } = useParams();
    const { league } = useLeague(league_id as string);
    const { user } = useUser();
    const { rounds } = useRounds();

    const router = useRouter();

    const isAdmin = user?.id === league?.admin_id;

    const navigateDraft = useCallback(
        (round_id) => {
            router.push(`/leagues/${league_id}/draft/${round_id}`);
        },
        [league_id]
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
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Round</Table.ColumnHeader>
                        <Table.ColumnHeader>Status</Table.ColumnHeader>
                        <Table.ColumnHeader></Table.ColumnHeader>
                        <Table.ColumnHeader></Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {rounds?.map((round) => (
                        <Table.Row key={round.id}>
                            <Table.Cell>{mapRound(round.round)}</Table.Cell>
                            <Table.Cell>{round.status}</Table.Cell>
                            <Table.Cell w="40px">
                                {round.status === 'started' ? (
                                    <Button onClick={navigateDraft}>Scoreboard</Button>
                                ) : null}
                            </Table.Cell>
                            <Table.Cell w="40px">
                                {round.status === 'drafting' ? (
                                    <Button onClick={() => navigateDraft(round.id)}>Draft</Button>
                                ) : null}
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}
