import { loadLeague } from '@/actions/league';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import build from 'next/dist/build';
import { set } from 'react-hook-form';


export const appSlice = createSlice({
    name: 'app',
    initialState: {
        round_id: 2,
        tab: 'scoreboard',
        leagues: null,
        league: null,
        member: null,
        user: null,
        team: null,
        teamName: '',
        rounds: [],
        pools: [],
    },
    reducers: {
        setLeagues: (state, action) => {
            state.leagues = action.payload  
        },
        setRounds: (state, action) => {
            state.rounds = action.payload
        },
        setTeamName: (state, action) => {
            state.teamName = action.payload
        },
        setTeam: (state, action) => {
            state.team = action.payload
            state.teamName = action.payload?.name ?? ''
        },
        setUser: (state, action) => {
            state.user = action.payload
        },
        setLeague: (state, action) => {
            state.league = action.payload
        },
        setTab: (state, action) => {
            state.tab = action.payload
        },
        setRoundId: (state, action) => {
            state.round_id = action.payload
        },
        setMember: (state, action) => {
            state.member = action.payload
        },
        setPools: (state, action) => {
            state.pools = action.payload
        }
    },
});
export const { setPools, setLeagues, setRounds, setTeamName, setTeam, setUser, setLeague, setTab, setRoundId, setMember} = appSlice.actions

export default appSlice.reducer