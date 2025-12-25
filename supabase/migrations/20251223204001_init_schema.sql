--
-- PostgreSQL database dump
--

-- Dumped from database version 15.6
-- Dumped by pg_dump version 15.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nfl_team_1 uuid NOT NULL,
    nfl_team_2 uuid NOT NULL,
    link text,
    start_time timestamp with time zone NOT NULL,
    nfl_round_id uuid,
    is_final boolean DEFAULT false
);


--
-- Name: league; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.league (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    admin_id uuid DEFAULT auth.uid(),
    name text NOT NULL
);


--
-- Name: league_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.league_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    league_id uuid,
    status character varying DEFAULT 'pending'::character varying,
    email character varying NOT NULL
);

--
-- Name: round_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.round_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    rb_count bigint DEFAULT '0'::bigint,
    flex_count bigint DEFAULT '0'::bigint,
    qb_count bigint DEFAULT '0'::bigint,
    wr_count bigint DEFAULT '0'::bigint,
    te_count bigint DEFAULT '0'::bigint,
    sf_count bigint DEFAULT '0'::bigint,
    rb_ppr double precision DEFAULT '1'::double precision,
    wr_ppr double precision DEFAULT '1'::double precision,
    te_ppr double precision DEFAULT '1'::double precision,
    pass_td double precision DEFAULT '4'::double precision,
    rush_td double precision DEFAULT '6'::double precision,
    rec_td double precision DEFAULT '6'::double precision,
    rush_yd double precision DEFAULT '1'::double precision,
    rec_yd double precision DEFAULT '1'::double precision,
    pass_yd double precision DEFAULT '0.04'::double precision,
    fum double precision DEFAULT '-2'::double precision,
    "int" double precision DEFAULT '-2'::double precision,
    round_id uuid,
    league_id uuid,
    max_team_size bigint GENERATED ALWAYS AS ((((((rb_count + wr_count) + qb_count) + flex_count) + sf_count) + te_count)) STORED
);


--
-- Name: nfl_rounds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfl_rounds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    round bigint NOT NULL,
    year bigint NOT NULL,
    status character varying DEFAULT 'pending'::character varying
);


--
-- Name: nfl_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfl_team (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    abbr text,
    city text
);

--
-- Name: player; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nfl_team_id uuid NOT NULL,
    name text NOT NULL,
    year bigint DEFAULT '2024'::bigint,
    is_wr boolean,
    is_te boolean,
    is_rb boolean,
    is_qb boolean,
    off_grade double precision
);



--
-- Name: pools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    league_id uuid NOT NULL,
    round_id uuid NOT NULL,
    name text NOT NULL,
    draft_order jsonb DEFAULT '[]'::jsonb,
    current uuid,
    status text DEFAULT 'drafting'::text,
    pick_number bigint DEFAULT '1'::bigint
);

--
-- Name: stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    player_id uuid NOT NULL,
    game_id uuid NOT NULL,
    rec_yds bigint DEFAULT '0'::bigint,
    rec bigint DEFAULT '0'::bigint,
    tar bigint DEFAULT '0'::bigint,
    rush_yds bigint DEFAULT '0'::bigint,
    rush_att bigint DEFAULT '0'::bigint,
    comp bigint DEFAULT '0'::bigint,
    pass_yds bigint DEFAULT '0'::bigint,
    pass_att bigint DEFAULT '0'::bigint,
    fum bigint DEFAULT '0'::bigint,
    "int" bigint DEFAULT '0'::bigint,
    rush_td bigint,
    pass_td bigint,
    rec_td bigint,
    "2pt" bigint
);

--
-- Name: team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    pool_id uuid,
    member_id uuid,
    name text,
    league_id uuid
);

--
-- Name: team_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    team_id uuid NOT NULL,
    player_id uuid NOT NULL,
    pool_id uuid,
    pick_number bigint
);

--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: league_members league_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.league_members
    ADD CONSTRAINT league_members_pkey PRIMARY KEY (id);


--
-- Name: league league_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.league
    ADD CONSTRAINT league_pkey PRIMARY KEY (id);


--
-- Name: round_settings league_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_settings
    ADD CONSTRAINT league_settings_pkey PRIMARY KEY (id);


--
-- Name: nfl_rounds nfl_rounds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfl_rounds
    ADD CONSTRAINT nfl_rounds_pkey PRIMARY KEY (id);


--
-- Name: nfl_team nfl_team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfl_team
    ADD CONSTRAINT nfl_team_pkey PRIMARY KEY (id);


--
-- Name: player player_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player
    ADD CONSTRAINT player_pkey PRIMARY KEY (id);


--
-- Name: pools pools_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_pkey1 PRIMARY KEY (id);


--
-- Name: stats stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stats
    ADD CONSTRAINT stats_pkey PRIMARY KEY (id);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (id);


--
-- Name: team_players team_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_players
    ADD CONSTRAINT team_players_pkey PRIMARY KEY (id);


--
-- Name: league_members_email_league_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX league_members_email_league_id_idx ON public.league_members USING btree (email, league_id);


--
-- Name: round_settings_round_id_league_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX round_settings_round_id_league_id_idx ON public.round_settings USING btree (round_id, league_id);


--
-- Name: team_players_pool_id_player_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_players_pool_id_player_id_idx ON public.team_players USING btree (pool_id, player_id);


--
-- Name: team_pool_id_member_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_pool_id_member_id_idx ON public.team USING btree (pool_id, member_id);


--
-- Name: games games_nfl_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_nfl_round_id_fkey FOREIGN KEY (nfl_round_id) REFERENCES public.nfl_rounds(id);


--
-- Name: games games_nfl_team_1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_nfl_team_1_fkey FOREIGN KEY (nfl_team_1) REFERENCES public.nfl_team(id);


--
-- Name: games games_nfl_team_2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_nfl_team_2_fkey FOREIGN KEY (nfl_team_2) REFERENCES public.nfl_team(id);


--
-- Name: league_members league_members_league_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.league_members
    ADD CONSTRAINT league_members_league_id_fkey FOREIGN KEY (league_id) REFERENCES public.league(id);


--
-- Name: league_members league_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.league_members
    ADD CONSTRAINT league_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: player player_nfl_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player
    ADD CONSTRAINT player_nfl_team_id_fkey FOREIGN KEY (nfl_team_id) REFERENCES public.nfl_team(id);


--
-- Name: pools pools_current_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_current_fkey FOREIGN KEY (current) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: pools pools_league_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_league_id_fkey1 FOREIGN KEY (league_id) REFERENCES public.league(id);


--
-- Name: pools pools_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.nfl_rounds(id);


--
-- Name: round_settings round_settings_league_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_settings
    ADD CONSTRAINT round_settings_league_id_fkey FOREIGN KEY (league_id) REFERENCES public.league(id);


--
-- Name: round_settings round_settings_round_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_settings
    ADD CONSTRAINT round_settings_round_id_fkey1 FOREIGN KEY (round_id) REFERENCES public.nfl_rounds(id);


--
-- Name: stats stats_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stats
    ADD CONSTRAINT stats_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: stats stats_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stats
    ADD CONSTRAINT stats_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.player(id);


--
-- Name: team team_league_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_league_id_fkey FOREIGN KEY (league_id) REFERENCES public.league(id) ON DELETE CASCADE;


--
-- Name: team team_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.league_members(id) ON DELETE CASCADE;


--
-- Name: team_players team_players_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_players
    ADD CONSTRAINT team_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.player(id);


--
-- Name: team_players team_players_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_players
    ADD CONSTRAINT team_players_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.pools(id) ON DELETE CASCADE;


--
-- Name: team_players team_players_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_players
    ADD CONSTRAINT team_players_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: team team_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.pools(id) ON DELETE CASCADE;


--
-- Name: nfl_team Boom Boom Boom 2; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Boom Boom Boom 2" ON public.nfl_team FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: pools Delete pools; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Delete pools" ON public.pools FOR DELETE USING ((league_id IN ( SELECT league.id
   FROM public.league
  WHERE (league.admin_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: league_members Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.league_members FOR INSERT TO authenticated WITH CHECK ((league_id IN ( SELECT league.id
   FROM public.league
  WHERE (league.admin_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: pools Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.pools FOR INSERT TO authenticated WITH CHECK ((league_id IN ( SELECT league.id
   FROM public.league
  WHERE (league.admin_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: round_settings Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.round_settings FOR INSERT TO authenticated WITH CHECK ((league_id IN ( SELECT league.id
   FROM public.league
  WHERE (league.admin_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: team_players Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.team_players FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: games Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.games FOR SELECT TO authenticated USING (true);


--
-- Name: league Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.league FOR SELECT TO authenticated USING (true);


--
-- Name: league_members Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.league_members FOR SELECT USING (((user_id = ( SELECT auth.uid() AS uid)) OR ((email)::text = ( SELECT (auth.jwt() ->> 'email'::text))) OR (league_id IN ( SELECT league.id
   FROM public.league
  WHERE (league.admin_id = ( SELECT auth.uid() AS uid))))));


--
-- Name: nfl_rounds Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.nfl_rounds FOR SELECT USING (true);


--
-- Name: nfl_team Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.nfl_team FOR SELECT TO authenticated USING (true);


--
-- Name: player Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.player FOR SELECT TO authenticated USING (true);


--
-- Name: pools Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.pools FOR SELECT TO authenticated USING (true);


--
-- Name: round_settings Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.round_settings FOR SELECT TO authenticated USING (true);


--
-- Name: stats Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.stats FOR SELECT TO authenticated USING (true);


--
-- Name: team Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.team FOR SELECT USING (true);


--
-- Name: team_players Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.team_players FOR SELECT TO authenticated USING (true);


--
-- Name: round_settings Enable update for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for authenticated users only" ON public.round_settings FOR UPDATE TO authenticated USING ((league_id IN ( SELECT league.id
   FROM public.league
  WHERE (league.admin_id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((league_id IN ( SELECT league.id
   FROM public.league
  WHERE (league.admin_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: league_members Enable update for users based on email; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for users based on email" ON public.league_members FOR UPDATE TO authenticated USING (((( SELECT auth.jwt() AS jwt) ->> 'email'::text) = (email)::text)) WITH CHECK (((( SELECT auth.jwt() AS jwt) ->> 'email'::text) = (email)::text));


--
-- Name: pools Enable update for users based on email; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for users based on email" ON public.pools FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: team Team Pool insert policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team Pool insert policy" ON public.team FOR INSERT TO authenticated WITH CHECK ((league_id IN ( SELECT league.id
   FROM public.league
  WHERE (league.admin_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: league_members dead members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "dead members" ON public.league_members FOR DELETE USING ((league_id IN ( SELECT league.id
   FROM public.league
  WHERE (league.admin_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: games; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

--
-- Name: league; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.league ENABLE ROW LEVEL SECURITY;

--
-- Name: league_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;

--
-- Name: nfl_rounds; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nfl_rounds ENABLE ROW LEVEL SECURITY;

--
-- Name: nfl_team; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nfl_team ENABLE ROW LEVEL SECURITY;

--
-- Name: player; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.player ENABLE ROW LEVEL SECURITY;

--
-- Name: pools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;

--
-- Name: round_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.round_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

--
-- Name: team; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;

--
-- Name: team_players; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;

--
-- Name: team update team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "update team" ON public.team FOR UPDATE TO authenticated USING (true);


--
-- PostgreSQL database dump complete
--

