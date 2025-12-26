import { create } from 'zustand';
import { Pool, Team } from '@/app/types';

interface DraftState {
  // Data
  pool: Pool | null;
  team: Team | null;

  // Actions
  setPool: (pool: Pool | null) => void;
  setTeam: (team: Team | null) => void;
  reset: () => void;
}

const initialState = {
  pool: null,
  team: null,
};

export const useDraftStore = create<DraftState>((set) => ({
  ...initialState,

  // Actions
  setPool: (pool) => set({ pool }),
  setTeam: (team) => set({ team }),
  reset: () => set(initialState),
}));
