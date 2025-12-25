'use client';
import { useAppSelector, useUser } from '@/app/hooks';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DraftTable from '@/components/draft-table';
import Teams from '@/components/teams';
import { useDraft } from '@/app/leagues/[league_id]/draft/hooks';
import { createClient } from '@/utils/supabase/client';

export function Draft({ leagueId, roundId }) {
    const app = useAppSelector((state) => state.app);
    const { league, member, rounds } = app;
    const { user } = useUser();
    const { pool, draftPlayer, refreshDraft, teams, team } = useDraft(league?.id, roundId as string, member);
    const currentRound = useMemo(() => {
        return rounds?.find((round) => round.id === roundId);
    }, [rounds, roundId]);

    const handleDropPlayer = useCallback((player_id: string) => {
        window.alert('Dropping' + player_id);
    }, []);

    const [innerWidth, setInnerWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setInnerWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleInserts = (payload) => {
            refreshDraft();
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
    }, [refreshDraft]);

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
                    <TabsList>
                        <TabsTrigger value="teams">Teams</TabsTrigger>
                        <TabsTrigger value="draft">Draft Table</TabsTrigger>
                    </TabsList>
                    <TabsContent value="teams">
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
                    <TabsContent value="draft">
                        <div className="p-5 bg-steel shadow-md rounded-md h-full border border-ui-border">
                            <DraftTable
                                pool={pool}
                                teams={teams}
                                team={team}
                                member={member}
                                draftPlayer={draftPlayer}
                                refreshDraft={refreshDraft}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto">
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
                <div className="flex-[5] p-5 bg-steel shadow-md rounded-xl h-full border border-ui-border">
                    <DraftTable
                        pool={pool}
                        teams={teams}
                        team={team}
                        member={member}
                        draftPlayer={draftPlayer}
                        refreshDraft={refreshDraft}
                    />
                </div>
            </div>
        </div>
    );
}
