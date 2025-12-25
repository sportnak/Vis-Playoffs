import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { Member, Team } from '@/app/types';

interface LoadingStates {
  user: boolean;
  member: boolean;
  team: boolean;
}

interface ErrorStates {
  user: string | null;
  member: string | null;
  team: string | null;
}

interface UserState {
  // Data
  user: User | null;
  member: Member | null;
  team: Team | null;
  teamName: string;

  // Loading states
  loadingStates: LoadingStates;

  // Error states
  errors: ErrorStates;

  // Actions
  setUser: (user: User | null) => void;
  setMember: (member: Member | null) => void;
  setTeam: (team: Team | null) => void;
  setTeamName: (name: string) => void;
  setLoading: (key: keyof LoadingStates, loading: boolean) => void;
  setError: (key: keyof ErrorStates, error: string | null) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  member: null,
  team: null,
  teamName: '',
  loadingStates: {
    user: false,
    member: false,
    team: false,
  },
  errors: {
    user: null,
    member: null,
    team: null,
  },
};

export const useUserStore = create<UserState>((set) => ({
  ...initialState,

  // Actions
  setUser: (user) => set({ user }),
  setMember: (member) => set({ member }),
  setTeam: (team) => set({ team, teamName: team?.name || '' }),
  setTeamName: (teamName) => set({ teamName }),

  setLoading: (key, loading) =>
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: loading },
    })),

  setError: (key, error) =>
    set((state) => ({
      errors: { ...state.errors, [key]: error },
    })),

  reset: () => set(initialState),
}));
