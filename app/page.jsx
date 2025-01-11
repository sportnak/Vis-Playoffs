'use client';
import { useEffect } from 'react';
import { InviteList } from '@/components/invite-list';
import LeaguesList from '@/components/leagues';
import { redirect } from 'next/navigation';
import { useLeague, useLeagues, useUser } from '@/app/hooks';

export default function Page() {
    const { leagues } = useLeagues();
    useEffect(() => {
        if (leagues?.length) {
            redirect(`/leagues/${leagues[0].id}`);
        }
    }, [leagues]);

    return (
        <main className="flex flex-col gap-8 sm:gap-16">
            <LeaguesList />
        </main>
    );
}
