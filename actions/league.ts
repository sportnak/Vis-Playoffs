'use server'

import { Member, Player, Pool, RoundSettings, TeamPlayer } from "@/app/types";
import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import { uniqueNamesGenerator, Config, names, adjectives, colors, animals } from 'unique-names-generator';

const config: Config = {
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    style: 'capital'
}
export async function loadLeagues() {
  const client = await createClient();
  const response = await client.from('league').select('*');
  return response
}

export async function inviteMember({ email, league_id }: { email: string; league_id: number }) {
  const client = await createClient();
  const response = await client.from('league_members').insert({ email, league_id });
  return response
}

export async function loadMembers({ league_id }: { league_id: number }) {
  const client = await createClient();
  const response = await client.from('league_members').select('*').eq('league_id', league_id);
  return response
}

export async function loadRounds() {
  const client = await createClient();
  const response = await client
    .from('nfl_rounds')
    .select('*, round_settings(*)')
  return response
}

export async function upsertSettings(data: RoundSettings) {
  const client = await createClient();
  const response = await client.from('round_settings').upsert({
    rb_count: data.rb_count,
    flex_count: data.flex_count,
    qb_count: data.qb_count,
    wr_count: data.wr_count,
    te_count: data.te_count,
    sf_count: data.sf_count,
    rb_ppr: data.rb_ppr,
    wr_ppr: data.wr_ppr,
    te_ppr: data.te_ppr,
    pass_td: data.pass_td,
    rush_td: data.rush_td,
    rec_td: data.rec_td,
    rush_yd: data.rush_yd,
    rec_yd: data.rec_yd,
    pass_yd: data.pass_yd,
    fum: data.fum,
    int: data.int,
    round_id: data.round_id,
    league_id: data.league_id
  }, {
    onConflict: 'round_id, league_id',
  });

  return response
}


export async function loadPools({ league_id, round_id }: { league_id: number; round_id: number }) {
    const client = await createClient();
    const response = await client.from('pools').select('*').eq('round_id', round_id).eq('league_id', league_id);
    return response
}

export async function createPools(count: number, league_id: number, round_id: number) {
    const client = await createClient();
    for (let i = 0; i < count; i++) {
        const res = await client.from('pools').insert({
            round_id,
            league_id,
            name: uniqueNamesGenerator(config)
        });
    }

    return
}

export async function loadTeams({ pool_ids }: { pool_ids: number[]}) {
    const client = await createClient();

    const response = await client.from('team')
        .select('*')
        .in('pool_id', pool_ids);
    
    return response
}

export async function assignPools({ members, pools }: { members: Member[]; pools: Pool[] }) {
    const client = await createClient();
    const loops = members.length / pools.length;
    const cloned_members = JSON.parse(JSON.stringify(members))
    const pool_map: { [pool_id: number]: number[]} = {}
    for (let i = 0; i < loops; i++) {
        for (let j = 0; j < pools.length; j++) {
            if (!cloned_members.length) {
                continue
            }
            const member_index = Math.floor(Math.random() * cloned_members.length);
            const member = cloned_members[member_index];
            cloned_members.splice(member_index, 1);
            const r = await client.from('team').insert({
                member_id: member.id,
                pool_id: pools[j].id
            }).select()
            if (r.error) {
                return r
            }
            const team_id = r.data?.[0].id;
            pool_map[pools[j].id] = [...(pool_map[pools[j].id] || []), team_id]
        }
    }

    for (const pool of pools) {
        await client.from('pools').update({
            current: pool_map[pool.id][0],
            draft_order: pool_map[pool.id]
        }).eq('id', pool.id);
    }
}

export async function loadNFLTeams() {
    const client = await createClient();
    const response = await client.from('nfl_teams').select('*');
    return response
}

export async function loadNFLPlayers(query: { drafted?: boolean,  name?: string, team_ids?: number[], round_id: string}, pool_id: number) {
    const client = await createClient();
    const nfl_round = await client.from('nfl_rounds').select('*').eq('id', query.round_id);
    const games = await client.from('games').select('*').eq('nfl_round_id', nfl_round.data[0].id);
    const teams = await client.from('nfl_team').select('*').in('id', games.data.map(x => [x.nfl_team_1, x.nfl_team_2]).flat());
    const request = client.from('player').select('*, nfl_team(*), team_players(*)').in('nfl_team_id', teams.data.map(x => x.id));
    if (query.name?.length) {
        request.ilike('name', `%${query.name}%`)
    }
    
    if (query.team_ids?.length) {
        request.in('nfl_team_id', query.team_ids)
    }
    
    if (!query.drafted && !query.name?.length) {
        request.is('team_players', null)
    }
    
    request.order('off_grade', { ascending: false}).limit(25);
    const response = await request;
    return response
}

export async function loadPool(round_id: number, member_id: number) {
    const client = await createClient();
    const response = await client.from('pools').select('*, team!team_pool_id_fkey(*)').not('team', 'is', null).eq('round_id', round_id).eq('team.member_id', member_id);
    return response
}

export async function loadMember(league_id: number, user: User) {
    const client = await createClient();
    const response = await client.from('league_members').select('*').eq('league_id', league_id).eq('email', user.email);
    return response
}

export async function loadTeam(pool_id: number, member_id: number) {
    const client = await createClient();
    const response = await client.from('team').select('*').eq('pool_id', pool_id).eq('member_id', member_id);
    return response
}

export async function loadTeamPlayers(pool_id: number) {
    const client = await createClient();
    const response = await client.from('team_players').select('*').eq('pool_id', pool_id);
    return response 
}

export async function draftPlayer(round_id: number, pool_id: number, team_id: number, player_id: number) {
    const client = await createClient();
    const player = await client.from('player').select('*').eq('id', player_id);
    const team = await client.from('team_players').select('*, player(*)').eq('team_id', team_id);
    const settings = await client.from('round_settings').select('*').eq('round_id', round_id);
    const pool = await client.from('pools').select('*').eq('id', pool_id);
    if (pool.data[0].current !== team_id) {
        return {
            error: {
                message: 'Its not your turn to pick'
            }
        }
    }

    if (!isPickValid(player.data[0], settings.data[0], team.data)) {
        return {
            error: {
                message: 'You don\'t have a spot for this player'
            }
        }
    }

    const response = await client.from('team_players').insert({
        pool_id,
        team_id,
        player_id
    });

    if (!response.error) {
        const next = pool.data[0].draft_order
        const curr_index = next.findIndex(x => x === team_id);
        const next_index = (curr_index === next.length - 1) ? 0 : (curr_index + 1);
        const res = await client.from('pools').update({ current: next[next_index] }).eq('id', pool_id);
        if (res.error) {
            return res
        }
    }

    return response
}

function isPickValid(player: Player, round_settings: RoundSettings, team: TeamPlayer[]) {
    const team_rb_count = team.filter(x => x.player.is_rb).length;
    const team_te_count = team.filter(x => x.player.is_te).length;
    const team_wr_count = team.filter(x => x.player.is_wr).length;
    const team_qb_count = team.filter(x => x.player.is_qb).length;

    const rb_spots = round_settings.rb_count - team_rb_count;
    const te_spots = round_settings.te_count - team_te_count;
    const wr_spots = round_settings.wr_count - team_wr_count;
    const qb_spots = round_settings.qb_count - team_qb_count;

    /** overflow > 0 means room */
    if (player.is_rb && rb_spots > 0) {
        return true
    }
    if (player.is_te && te_spots > 0) {
        return true
    }
    if (player.is_wr && wr_spots > 0) {
        return true
    }
    if (player.is_qb && qb_spots > 0) {
        return true
    }

    /*** calcualte FLEX spots */
    let flex_spots = round_settings.flex_count
    if (rb_spots < 0) {
        flex_spots = flex_spots + rb_spots
    }

    if (te_spots < 0) {
        flex_spots = flex_spots + te_spots
    }

    if (wr_spots < 0) {
        flex_spots = flex_spots + wr_spots
    }
    
    /** if we have flex spots the pick is valid for rb, te, wr */
    if (flex_spots >  0 && (player.is_rb || player.is_te || player.is_wr)) {
        return true
    }

    let sf_spots = round_settings.sf_count;
    if (flex_spots < 0) {
        sf_spots = sf_spots + flex_spots
    }

    if (qb_spots < 0) {
        sf_spots = sf_spots + qb_spots
    }

    /** if we have sf spots the pick is valid */
    if (sf_spots > 0 ) {
        return true
    }

    return false
}