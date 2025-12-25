'use client';

import { typedClient } from '@/utils/supabase/supabase';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export function useUser(): { user: User | null } {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function loadUser() {
            const {
                data: { user: fetchedUser }
            } = await typedClient.auth.getUser();
            setUser(fetchedUser);
        }

        loadUser();
    }, [router]);

    return { user };
}

export function useApp(league_id: string) {
    const app = useAppSelector((state) => state.app);
    const dispatch = useAppDispatch();
    const { user } = useUser();
    const { member } = useMember(league_id, user);
    const { team, load: refreshTeam } = useTeam(league_id, member?.id);
    const { rounds } = useRounds(league_id);
    const { league } = useLeague(league_id);
    const { pools } = usePools(app.league?.id);

    useEffect(() => {
      dispatch(setPools(pools))
    }, [pools])

    useEffect(() => {
      dispatch(setLeague(league))
    }, [league])
    
    useEffect(() => {
      dispatch(setRounds(rounds))
    }, [rounds])

    useEffect(() => {
        dispatch(setMember(member));
    }, [member]);

    useEffect(() => {
        dispatch(setUser(user));
    }, [user]);

    useEffect(() => {
        dispatch(setTeam(team));
    }, [team]);

    useEffect(() => {
      if (app.teamName !== team?.name) {
        refreshTeam()
      }
    }, [app.teamName, team])

    useEffect(() => {

    }, [app.round_id])

    return {
        app,
    };
}

/**
 *
 * @param league_id string from route param
 * @returns
 */
export function useLeague(league_id: string) {
    const { leagues } = useLeagues();
    const league = useMemo(() => {
        if (leagues && league_id) {
            return leagues.find((l) => l.id === league_id);
        }
        return null;
    }, [leagues, league_id]);

    return { league };
}

export function useLeagues() {
    const leagues = useAppSelector((state) => state.app.leagues);
    const dispatch = useAppDispatch();
    const { user } = useUser();

    const load = useCallback(async () => {
      const response = await loadLeagues(user);
      dispatch(setLeagues(response.data));
    }, [user])

    useEffect(() => {
        if (leagues != null || user == null) {
            return;
        }

        load();
    }, [leagues, user]);

    return { leagues, refresh: load };
}

import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { loadLeague, loadLeagues } from '@/actions/league';
import {
    setLeague,
    setMember,
    setRoundId,
    setRounds,
    setLeagues,
    setTab,
    setTeam,
    setUser,
    setPools
} from '@/store/appSlice';
import { useMember, useTeam } from './leagues/[league_id]/draft/hooks';
import { usePools, useRounds } from './leagues/[league_id]/manage/hooks';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
