'use client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DraftTable from '@/components/draft-table';
import Teams, { TeamCard } from '@/components/teams';
import { useDraft } from '@/app/leagues/[league_id]/draft/hooks';
import { createClient } from '@/utils/supabase/client';
import { useLeagueStore } from '@/stores/league-store';
import { useUserStore } from '@/stores/user-store';
import { H1, H3, P } from './ui/text';

export function Draft({ leagueId, roundId }) {
    const league = useLeagueStore((state) => state.currentLeague);
    const member = useUserStore((state) => state.member);
    const rounds = useLeagueStore((state) => state.rounds);
    const { pool, draftPlayer, refreshDraft, teams, team } = useDraft(leagueId, roundId as string, member);
    const currentRound = useMemo(() => {
        return rounds?.find((round) => round.id === roundId);
    }, [rounds, roundId]);

    const handleDropPlayer = useCallback((player_id: string) => {
        window.alert('Dropping' + player_id);
    }, []);

    const [innerWidth, setInnerWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    useEffect(() => {
        const handleResize = () => setInnerWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const refreshDraftRef = React.useRef(refreshDraft);
    useEffect(() => {
        refreshDraftRef.current = refreshDraft;
    }, [refreshDraft]);

    useEffect(() => {
        const handleInserts = (payload) => {
            refreshDraftRef.current();
        };

        const client = createClient();
        const channel = client.channel('supabase_realtime');
        // Listen to inserts
        channel
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pools' }, handleInserts)
            .subscribe();

        return () => {
            client.removeChannel(channel);
        };
    }, []);

    if (!league) {
        return (
            <div className="flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    const isMobile = innerWidth < 768; // Check if viewport width is less than 768px
    if (isMobile) {
        return (
            <div className="w-full mx-auto">
                <Tabs defaultValue="draft">
                    <TabsList className="w-full">
                        <TabsTrigger value="teams" className="flex-1 text-xs">My Team</TabsTrigger>
                        <TabsTrigger value="draft" className="flex-1 text-xs">Draft</TabsTrigger>
                        <TabsTrigger value="all-teams" className="flex-1 text-xs">All Teams</TabsTrigger>
                    </TabsList>
                    <TabsContent value="teams" className="mt-2">
                        <div className="flex-[2]">
                            <Teams
                                pool={pool}
                                dropPlayer={handleDropPlayer}
                                teams={teams}
                                round={currentRound}
                                memberId={member?.id}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="draft" className="mt-2">
                        <div className="p-2 bg-steel shadow-md rounded-md h-full border border-ui-border">
                            {currentRound?.round_settings?.length ?
                                <DraftTable
                                    pool={pool}
                                    teams={teams}
                                    team={team}
                                    member={member}
                                    draftPlayer={draftPlayer}
                                    refreshDraft={refreshDraft}
                                /> : <P className="tracking-mono h-[136px] justify-center items-center flex">
                                    Admin must confirm roster configurations</P>
                            }
                        </div>
                    </TabsContent>
                    <TabsContent value="all-teams" className="mt-2">
                        {!pool ? (
                            <div className="p-8 bg-steel border border-ui-border rounded-md flex justify-center">
                                <P className="text-cool-gray tracking-mono text-xs">No draft pool available</P>
                            </div>
                        ) : (
                            <div className="bg-steel border border-ui-border shadow-md rounded-md">
                                <P className="py-2 px-4 border-b border-ui-border font-light font-roboto-mono tracking-[0.025rem] text-sm">
                                    ALL TEAMS
                                </P>
                                <div className="p-2 space-y-3">
                                    {teams?.map(team => (
                                        <div key={team.id} className="border border-ui-border rounded-md bg-polar-night/30">
                                            <div className="px-3 py-2 border-b border-ui-border">
                                                <P className="font-semibold font-roboto-mono text-xs">{team.name}</P>
                                            </div>
                                            <div className="p-3">
                                                <TeamCard
                                                    showScore={false}
                                                    team={team}
                                                    round={currentRound}
                                                    pool={pool}
                                                    memberId={team.member_id}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto space-y-6">
            <div className="flex w-full items-start gap-8">
                <div className="flex-[2] sm:flex-[3]">
                    <Teams
                        pool={pool}
                        dropPlayer={handleDropPlayer}
                        teams={teams}
                        round={currentRound}
                        memberId={member?.id}
                    />
                </div>
                <div className="flex-[5] bg-steel shadow-md rounded-xl h-full border border-ui-border">
                    {currentRound?.round_settings?.length ?
                        <DraftTable
                            pool={pool}
                            teams={teams}
                            team={team}
                            member={member}
                            draftPlayer={draftPlayer}
                            refreshDraft={refreshDraft}
                        /> : <P className="tracking-mono h-[136px] justify-center items-center flex">
                            Admin must confirm roster configurations</P>
                    }
                </div>
            </div>

            {pool && teams && teams.length > 0 && (
                <div className="w-full">
                    <div className="bg-steel border border-ui-border shadow-md rounded-md">
                        <P className="py-2 px-4 border-b border-ui-border font-light font-roboto-mono tracking-[0.025rem] text-sm">
                            ALL TEAMS
                        </P>
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teams.map(team => (
                                    <div key={team.id} className="border border-ui-border rounded-md bg-polar-night/30 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-ui-border bg-steel/50">
                                            <P className="font-semibold font-roboto-mono text-sm">{team.name}</P>
                                        </div>
                                        <div className="p-4">
                                            <TeamCard
                                                showScore={false}
                                                team={team}
                                                round={currentRound}
                                                pool={pool}
                                                memberId={team.member_id}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
