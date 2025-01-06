import { configureStore } from '@reduxjs/toolkit';
import leaguesReducer from './leaguesSlice';
import leagueReducer from './leagueSlice';

const store = configureStore({
  reducer: {
    leagues: leaguesReducer,
    league: leagueReducer
  },
});

export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store

export default store;