import { createSlice } from '@reduxjs/toolkit';

export const draftSlice = createSlice({
    name: 'league',
    initialState: {
        member: null,
        pool: null,
        team: null,
    },
    reducers: {
        setTeam: (state, action) => {
            state.team = action.payload
        },
        setMember: (state, action) => {
            state.member = action.payload
        },
        setPool: (state, action) => {
            state.pool = action.payload
        },
    },
});
export const { setMember, setPool,  setTeam } = draftSlice.actions

export default draftSlice.reducer