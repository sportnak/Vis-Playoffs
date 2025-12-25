import { create } from 'zustand';
import { League, NFLRound, Pool } from '@/app/types';

interface LoadingStates {
  leagues: boolean;
  league: boolean;
  rounds: boolean;
  pools: boolean;
}

interface ErrorStates {
  leagues: string | null;
  league: string | null;
  rounds: string | null;
  pools: string | null;
}

interface LeagueState {
  // Data
  leagues: League[] | null;
  currentLeague: League | null;
  rounds: NFLRound[] | null;
  pools: Pool[] | null;

  // Loading states
  loadingStates: LoadingStates;

  // Error states
  errors: ErrorStates;

  // Actions
  setLeagues: (leagues: League[] | null) => void;
  setCurrentLeague: (league: League | null) => void;
  setRounds: (rounds: NFLRound[] | null) => void;
  setPools: (pools: Pool[] | null) => void;
  setLoading: (key: keyof LoadingStates, loading: boolean) => void;
  setError: (key: keyof ErrorStates, error: string | null) => void;
  reset: () => void;
}

const initialState = {
  leagues: null,
  currentLeague: null,
  rounds: null,
  pools: null,
  loadingStates: {
    leagues: false,
    league: false,
    rounds: false,
    pools: false,
  },
  errors: {
    leagues: null,
    league: null,
    rounds: null,
    pools: null,
  },
};

export const useLeagueStore = create<LeagueState>((set) => ({
  ...initialState,

  // Actions
  setLeagues: (leagues) => set({ leagues }),
  setCurrentLeague: (league) => set({ currentLeague: league }),
  setRounds: (rounds) => set({ rounds }),
  setPools: (pools) => set({ pools }),

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
