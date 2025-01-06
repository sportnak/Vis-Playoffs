import { loadLeagues } from '@/actions/league';
import { createSlice } from '@reduxjs/toolkit';

export const leagueSlice = createSlice({
    name: 'league',
    initialState: {
        leagues: null,
    },
    reducers: {
        setLeagues: (state, action) => {
            state.leagues = action.payload
        }
    },
});
export const { setLeagues} = leagueSlice.actions

export default leagueSlice.reducer