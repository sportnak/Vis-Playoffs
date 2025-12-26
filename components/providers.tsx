'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useEffect, Suspense } from 'react';
import { useUserStore } from '@/stores/user-store';
import { typedClient } from '@/utils/supabase/supabase';
import Header from '@/components/header';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize user on app load
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user }
      } = await typedClient.auth.getUser();
      useUserStore.getState().setUser(user);
    }

    loadUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div />}>
        <Header />
      </Suspense>
      {children}
    </QueryClientProvider>
  );
}
