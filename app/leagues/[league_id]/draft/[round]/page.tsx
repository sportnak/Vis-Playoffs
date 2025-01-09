'use client';
import { useLeague, useUser } from '@/app/hooks';
import { Box, Center, Heading, HStack, Input, Tabs, Text } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DraftTable from '@/components/draft-table';
import { useDraft } from '../hooks';
import Teams from '@/components/teams';
import { toaster } from '@/components/ui/toaster';
import Link from 'next/link';

const LeagueView = () => {
    const { league_id: leagueId, round: roundId } = useParams();
    const { league } = useLeague(leagueId.toString());
    const { league_id, round: round_id } = useParams();
    const { user } = useUser();
    const { member, pool, draftPlayer, refreshDraft, teams, rounds, updateName } = useDraft(
        parseInt(league_id as string),
        parseInt(round_id as string),
        user
    );
    const currentRound = useMemo(() => {
        return rounds?.find((round) => round.id === parseInt(round_id as string));
    }, [rounds, round_id]);

    const [teamName, setTeamName] = useState('');
    useEffect(() => {
        const teamName = teams?.find((team) => team.member_id === member.id)?.name;
        setTeamName(teamName);
    }, [teams, member]);

    const handleNameChange = useCallback((e) => {
        setTeamName(e.target.value);
    }, []);

    const db = useRef(null);
    useEffect(() => {
        if (db.current) {
            clearTimeout(db.current);
        }
        console.log('sdlk', teamName);

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
        <Box w={'100%'} mx={'auto'} p={5}>
            <HStack pb="20px" justifyContent={'space-between'}>
                <Link href={`/leagues/${league.id}`}>
                    <Heading as="h2" size="lg">
                        {'< '}
                        {league.name}
                    </Heading>
                </Link>
                <Input
                    style={{ borderColor: 'gray' }}
                    value={teamName}
                    onChange={handleNameChange}
                    w="250px"
                    placeholder="Name"
                />
            </HStack>
            <HStack w="100%" alignItems={'flex-start'} gap={8}>
                {/* <Teams /> */}
                <Box flex="2" h="100vh">
                    <Teams teams={teams} round={currentRound} memberId={member?.id} />
                </Box>
                <Box flex="5">
                    <DraftTable
                        roundId={round_id}
                        pool={pool}
                        teams={teams}
                        member={member}
                        draftPlayer={draftPlayer}
                        refreshDraft={refreshDraft}
                    />
                </Box>
            </HStack>
        </Box>
    );
};

export default LeagueView;
