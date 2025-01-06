'use client'

import { typedClient } from "@/utils/supabase/supabase";
import { useEffect, useMemo, useState} from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export function useUser(): { user: User | null} {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: fetchedUser },
      } = await typedClient.auth.getUser();
      setUser(fetchedUser);
    }

    loadUser()
  }, [router])

  return { user }
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
            return leagues.find((l) => l.id === parseInt(league_id));
        }
        return null;
    }, [leagues, league_id]);

    return { league }
}

export function useLeagues(): { leagues: any} {
    const leagues = useAppSelector((state) => state.leagues.leagues);
    const dispatch = useAppDispatch();


    useEffect(() => {
        if (leagues != null) {
            return;
        }

        async function load() {
            const response = await loadLeagues();
            dispatch(setLeagues(response.data));
        }

        load();
    }, [leagues]);

  return { leagues }
}

import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'
import { loadLeagues } from "@/actions/league";
import { setLeagues } from "@/store/leaguesSlice";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()