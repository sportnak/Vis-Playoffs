import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { loadLeague, loadRounds, loadPools, loadMember, loadTeam } from '@/actions/league';
import { useLeagueStore } from '@/stores/league-store';
import { useUserStore } from '@/stores/user-store';

export function useLeaguePageData(league_id: string) {
  const user = useUserStore((state) => state.user);

  // Parallel queries - no waterfall!
  const leagueQuery = useQuery({
    queryKey: ['league', league_id],
    queryFn: async () => {
      const response = await loadLeague(league_id, user!);
      return response.data?.[0] || null;
    },
    enabled: !!league_id && !!user,
  });

  const roundsQuery = useQuery({
    queryKey: ['rounds', league_id],
    queryFn: async () => {
      const response = await loadRounds(league_id);
      return response.data || null;
    },
    enabled: !!league_id,
    staleTime: Infinity, // Rounds don't change during a session
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const memberQuery = useQuery({
    queryKey: ['member', league_id, user?.id],
    queryFn: async () => {
      const response = await loadMember(league_id, user!);
      return response.data?.[0] || null;
    },
    enabled: !!league_id && !!user,
  });

  const teamQuery = useQuery({
    queryKey: ['team', league_id, memberQuery.data?.id],
    queryFn: async () => {
      const response = await loadTeam(league_id, memberQuery.data!.id);
      return response.data?.[0] || null;
    },
    enabled: !!memberQuery.data?.id,
  });

  const poolsQuery = useQuery({
    queryKey: ['pools', league_id],
    queryFn: async () => {
      const response = await loadPools({ league_id });
      return response.data || null;
    },
    enabled: !!league_id,
    staleTime: 1000 * 30, // 30 seconds - pools can change during drafts
  });

  // Sync to Zustand for components that need global access
  useEffect(() => {
    if (leagueQuery.data) {
      useLeagueStore.getState().setCurrentLeague(leagueQuery.data);
    }
  }, [leagueQuery.data]);

  useEffect(() => {
    if (roundsQuery.data) {
      useLeagueStore.getState().setRounds(roundsQuery.data);
    }
  }, [roundsQuery.data]);

  useEffect(() => {
    if (poolsQuery.data) {
      useLeagueStore.getState().setPools(poolsQuery.data);
    }
  }, [poolsQuery.data]);

  useEffect(() => {
    if (memberQuery.data) {
      useUserStore.getState().setMember(memberQuery.data);
    }
  }, [memberQuery.data]);

  useEffect(() => {
    if (teamQuery.data) {
      useUserStore.getState().setTeam(teamQuery.data);
    }
  }, [teamQuery.data]);

  return {
    isLoading:
      leagueQuery.isLoading ||
      roundsQuery.isLoading ||
      memberQuery.isLoading ||
      (memberQuery.data && teamQuery.isLoading),
    isError: leagueQuery.isError || roundsQuery.isError,
    league: leagueQuery,
    rounds: roundsQuery,
    member: memberQuery,
    team: teamQuery,
    pools: poolsQuery,
  };
}
