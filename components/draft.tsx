'use client';
import { useLeague, useUser } from '@/app/hooks';
import { Box, Center, Heading, HStack, Input, Tabs, Text } from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DraftTable from '@/components/draft-table';
import Teams from '@/components/teams';
import { toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { useDraft } from '@/app/leagues/[league_id]/draft/hooks';

export function Draft({ leagueId, roundId }) {
    const { league } = useLeague(leagueId.toString());
    const { user } = useUser();
    const { member, pool, draftPlayer, refreshDraft, teams, rounds, updateName, team } = useDraft(
        league?.id,
        parseInt(roundId as string),
        user
    );
    const currentRound = useMemo(() => {
        return rounds?.find((round) => round.id === parseInt(roundId as string));
    }, [rounds, roundId]);

    const [teamName, setTeamName] = useState('');
    useEffect(() => {
        const teamName = teams?.find((team) => team.member_id === member.id)?.name;
        setTeamName(teamName);
    }, [teams, member]);

    const handleNameChange = useCallback((e) => {
        setTeamName(e.target.value);
    }, []);

    const handleDropPlayer = useCallback((player_id: number) => {
        window.alert('Dropping' + player_id);
    }, []);

    const db = useRef(null);
    useEffect(() => {
        if (db.current) {
            clearTimeout(db.current);
        }

        db.current = setTimeout(async () => {
            const res = await updateName(teamName);
            if (res && !res.error) {
                toaster.create({
                    type: 'success',
                    title: 'Team name updated'
                });
            }
        }, 500);
    }, [teamName, updateName]);

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
                        roundId={roundId}
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
