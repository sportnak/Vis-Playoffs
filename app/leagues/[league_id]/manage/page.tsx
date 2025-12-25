'use client';
import { useLeague, useUser } from '@/app/hooks';
import MembersTable from '@/components/members';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { useMembers, useRounds } from './hooks';
import Rounds from '@/components/rounds';
import LeagueInfo from '@/components/league-info';
import GeneralSettings from '@/components/general-settings';
import { H2, P } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ManageLeague() {
    const { user } = useUser();
    const { league_id } = useParams();
    const { league } = useLeague(league_id.toString());
    const router = useRouter();

    const { members } = useMembers(league?.id);
    const { rounds } = useRounds(league?.id);

    const items = useMemo(
        () => [
            {
                title: 'ROUNDS',
                content: <Rounds rounds={rounds} leagueId={league?.id} />
            },
            {
                title: 'LEAGUE INFO',
                content: <LeagueInfo league={league} />
            },
            {
                title: 'MEMBERS',
                content: <MembersTable members={members} league_id={league?.id} />
            },
            {
                title: 'GENERAL',
                content: <GeneralSettings league={league} />
            }
        ],
        [members, league, rounds]
    );

    const handleLeagueHome = useCallback(() => {
        router.push(`/leagues/${league_id}`);
    }, [league_id]);

    if (!league || !user) {
        return (
            <div className="flex justify-center">
                <P>Loading...</P>
            </div>
        );
    }

    if (league.admin_id !== user?.id) {
        router.push(`/leagues/${league_id}`);
        return;
    }

    return (
        <div className="max-w-[1000px] mx-auto p-[5px]">
            <H2 className="pb-5 flex items-center gap-2">
                <Button variant="plain" size="sm" onClick={handleLeagueHome}>
                    {'<'}
                </Button>
                {league.name} Settings
            </H2>

            <Tabs defaultValue="Rounds" className="w-full">
                <TabsList className="w-full">
                    {items.map((item, index) => (
                        <TabsTrigger key={index} value={item.title}>
                            {item.title}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {items.map((item, index) => (
                    <TabsContent
                        key={index}
                        value={item.title}
                        className="min-h-[200px]"
                    >
                        {item.content}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
