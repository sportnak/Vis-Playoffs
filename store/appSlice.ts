import { createSlice } from '@reduxjs/toolkit';

export const appSlice = createSlice({
    name: 'app',
    initialState: {
        round_id: 2,
        tab: 'scoreboard',
    },
    reducers: {
        setTab: (state, action) => {
            state.tab = action.payload
        },
        setRoundId: (state, action) => {
            state.round_id = action.payload
        }
    },
});
export const { setTab, setRoundId } = appSlice.actions

export default appSlice.reducer