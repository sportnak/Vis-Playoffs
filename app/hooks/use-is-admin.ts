import { useMemo } from 'react';
import { useLeagueStore } from '@/stores/league-store';
import { useUserStore } from '@/stores/user-store';

export function useIsLeagueAdmin(league_id?: string): boolean {
    const { currentLeague } = useLeagueStore();
    const { user, member } = useUserStore();

    return useMemo(() => {
        if (!user || !member) return false;

        // If we have the member data with role, use it
        if (member.role === 'admin') return true;

        // Otherwise check league_members from the current league
        const leagueMembers = currentLeague?.league_members;
        if (!leagueMembers || !user.id) return false;

        const userMember = leagueMembers.find(m => m.user_id === user.id);
        return userMember?.role === 'admin';
    }, [user, member, currentLeague]);
}
