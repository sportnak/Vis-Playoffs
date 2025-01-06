import { createSlice } from '@reduxjs/toolkit';

export const leagueSlice = createSlice({
    name: 'league',
    initialState: {
        league: null,
        members: null,
        rounds: null,
    },
    reducers: {
        setLeague: (state, action) => {
            state.league = action.payload
        },
        setMembers: (state, action)=>{
            state.members = action.payload
        },
        setRounds: (state, action)=>{
            state.rounds = action.payload
        }
    },
});
export const { setLeague, setMembers, setRounds } = leagueSlice.actions

export default leagueSlice.reducer