'use client';
import { InviteList } from '@/components/invite-list';
import LeaguesList from '@/components/leagues';
import { useLeague, useLeagues, useUser } from '@/app/hooks';

export default function Page() {
    return (
        <main className="flex flex-col gap-8 sm:gap-16">
            <LeaguesList />
        </main>
    );
}
