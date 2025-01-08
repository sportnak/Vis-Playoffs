'use client';
import { useUser } from '@/app/hooks';
import { useNFLTeams } from '@/app/leagues/[league_id]/draft/hooks';
export default function NFLTeamPage() {
    const user = useUser();
    const { nflTeams } = useNFLTeams();
    if (user.user?.id !== 'bd01fe62-8109-4c78-9820-8e7b8b61a7b8') {
        return;
    }

    return <div>Hello world</div>;
}
