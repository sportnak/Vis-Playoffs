'use client'

import { typedClient } from "@/utils/supabase/supabase";
import { useEffect, useState} from "react";
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

import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()