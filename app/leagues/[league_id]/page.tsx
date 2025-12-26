'use client';
import { useParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useURLState } from '@/hooks/use-url-state';
import { useLeaguePageData } from '@/hooks/use-league-data';
import { useUIStore } from '@/stores/ui-store';
import { LeagueHeader } from '@/components/league-header';
import { Scoreboard } from '@/components/scoreboard';
import Rounds from '@/components/rounds';
import { Draft } from '@/components/draft';
import MembersTable from '@/components/members';
import {
    LeagueHeaderSkeleton,
    ScoreboardSkeleton,
    DraftSkeleton,
    SettingsSkeleton,
    TeamsSkeleton
} from '@/components/skeletons/league-skeleton';
import { P } from '@/components/ui/text';

function LeagueContent() {
    const { league_id } = useParams();
    const { tab, round_id, updateURLState } = useURLState();
    const { isLoading, isError, league, rounds } = useLeaguePageData(league_id as string);

    // Sync URL state to Zustand UI store
    useEffect(() => {
        useUIStore.getState().setTab(tab);
    }, [tab]);

    useEffect(() => {
        useUIStore.getState().setRoundId(round_id);
    }, [round_id]);

    // Loading state with appropriate skeletons
    if (isLoading) {
        return (
            <div>
                <LeagueHeaderSkeleton />
                {tab === 'scoreboard' && <ScoreboardSkeleton />}
                {tab === 'draft' && <DraftSkeleton />}
                {tab === 'settings' && <SettingsSkeleton />}
                {tab === 'teams' && <TeamsSkeleton />}
            </div>
        );
    }

    // Error state
    if (isError || !league) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <P className="text-xl">Failed to load league</P>
            </div>
        );
    }

    return (
        <div>
            <LeagueHeader />
            {tab === 'scoreboard' && <Scoreboard league_id={league_id as string} />}
            {tab === 'settings' && <Rounds rounds={rounds} leagueId={league.id} />}
            {tab === 'draft' && <Draft leagueId={league.id} roundId={round_id} />}
            {tab === 'teams' && <MembersTable league_id={league.id} members={league.league_members} />}
        </div>
    );
}

export default function League() {
    return (
        <Suspense fallback={<LeagueHeaderSkeleton />}>
            <LeagueContent />
        </Suspense>
    );
}
