import { createSlice } from '@reduxjs/toolkit';

export const leaguesSlice = createSlice({
    name: 'leagues',
    initialState: {
        leagues: null,
    },
    reducers: {
        setLeagues: (state, action) => {
            state.leagues = action.payload
        }
    },
});
export const { setLeagues } = leaguesSlice.actions

export default leaguesSlice.reducer