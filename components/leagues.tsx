'use client';
import { loadLeagues } from '@/actions/league';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setLeagues } from '@/store/appSlice';
import { Box, Center, Heading, Spinner, Table } from '@chakra-ui/react';
import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LeaguesList = () => {
    const leagues = useAppSelector((state) => state.app.leagues);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (leagues != null) {
            return;
        }

        async function load() {
            const response = await loadLeagues();
            dispatch(setLeagues(response.data));
        }

        load();
    }, [leagues]);

    const router = useRouter();
    const setActiveLeague = useCallback((id: number) => {
        router.push(`/leagues/${id}`);
    }, []);

    if (leagues == null) {
        return (
            <Center maxW={'1000px'} mx={'auto'} p={5}>
                <Spinner size="xl" />
            </Center>
        );
    }

    return (
        <Box maxW={'1000px'} mx={'auto'} p={5}>
            <Heading as="h2" size="lg" pb="20px">
                Your Leagues
            </Heading>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>ID</Table.ColumnHeader>
                        <Table.ColumnHeader>Name</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {leagues.map((league) => (
                        <Table.Row
                            style={{ cursor: 'pointer' }}
                            key={league.id}
                            onClick={() => setActiveLeague(league.id)}
                        >
                            <Table.Cell>{league.id}</Table.Cell>
                            <Table.Cell>{league.name}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    );
};

export default LeaguesList;
