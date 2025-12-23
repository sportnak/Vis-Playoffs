'use client';
import { useApp, useAppSelector, useLeague, useLeagues, useUser } from '@/app/hooks';
import { Box, Button, Center, DialogTrigger, Heading, HStack, Table, Tabs, Text } from '@chakra-ui/react';
import { redirect, useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Scoreboard } from '@/components/scoreboard';
import { LeagueHeader } from '@/components/league-header';
import Rounds from '@/components/rounds';
import { Draft } from '@/components/draft';
import MembersTable from '@/components/members';

export default function League() {
    const { league_id } = useParams();
    const { app } = useApp(league_id as string);

    if (!app.league) {
        return (
            <Center>
                <Text>Loading...</Text>
            </Center>
        );
    }

    if (app.tab === 'scoreboard') {
        return (
            <Box>
                <LeagueHeader />
                <Scoreboard league_id={league_id} />
            </Box>
        );
    }

    if (app.tab === 'settings') {
        return (
            <Box>
                <LeagueHeader />
                <Rounds rounds={app.rounds} leagueId={app.league?.id} />
            </Box>
        );
    }

    if (app.tab === 'draft') {
        return (
            <Box>
                <LeagueHeader />
                <Draft leagueId={app.league?.id} roundId={app.round_id} />
            </Box>
        );
    }

    if (app.tab === 'teams') {
        return (
            <Box>
                <LeagueHeader />
                <MembersTable league_id={app.league?.id} members={app.league.league_members} />
            </Box>
        );
    }

    return (
        <Box>
            <LeagueHeader />
            <HStack w="100%" justifyContent="space-between">
                <Heading as="h2" size="lg" pb="20px">
                    {app.league.name}
                </Heading>
            </HStack>
        </Box>
    );
}
