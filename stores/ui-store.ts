import { create } from 'zustand';

interface UIState {
  tab: 'scoreboard' | 'draft' | 'settings' | 'teams' | null;
  round_id: string | null;

  // Actions
  setTab: (tab: string) => void;
  setRoundId: (round_id: string) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  tab: null,
  round_id: null,

  // Actions
  setTab: (tab) => set({ tab: tab as UIState['tab'] }),
  setRoundId: (round_id) => set({ round_id }),
  reset: () => set({ tab: null, round_id: null }),
}));
