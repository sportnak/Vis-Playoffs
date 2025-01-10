'use client';
import { useAppSelector, useLeague, useUser } from '@/app/hooks';
import { Box, Center, Heading, HStack, Input, Tabs, Text } from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DraftTable from '@/components/draft-table';
import Teams from '@/components/teams';
import { toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { useDraft } from '@/app/leagues/[league_id]/draft/hooks';

export function Draft({ leagueId, roundId }) {
    const app = useAppSelector((state) => state.app);
    const { league, member, rounds } = app;
    const { user } = useUser();
    const { pool, draftPlayer, refreshDraft, teams, team } = useDraft(league?.id, parseInt(roundId as string), user);
    const currentRound = useMemo(() => {
        return rounds?.find((round) => round.id === parseInt(roundId as string));
    }, [rounds, roundId]);

    const handleDropPlayer = useCallback((player_id: number) => {
        window.alert('Dropping' + player_id);
    }, []);

    if (!league) {
        return (
            <Center>
                <Text>Loading...</Text>
            </Center>
        );
    }

    return (
        <Box w={'100%'} mx={'auto'}>
            <HStack w="100%" alignItems={'flex-start'} gap={8}>
                <Box flex="2">
                    <Teams
                        pool={pool}
                        dropPlayer={handleDropPlayer}
                        teams={teams}
                        round={currentRound}
                        memberId={member?.id}
                    />
                </Box>
                <Box flex="5" p="20px" bg="rgba(255, 255, 255, 0.5)" boxShadow="md" borderRadius="6px" h="100%">
                    <DraftTable
                        pool={pool}
                        teams={teams}
                        team={team}
                        member={member}
                        draftPlayer={draftPlayer}
                        refreshDraft={refreshDraft}
                    />
                </Box>
            </HStack>
        </Box>
    );
}
