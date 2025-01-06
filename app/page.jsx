'use client';
import LeaguesList from '@/components/leagues';

export default function Page() {
    return (
        <main className="flex flex-col gap-8 sm:gap-16">
            <LeaguesList />
        </main>
    );
}
