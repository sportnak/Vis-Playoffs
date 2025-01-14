'use server';

import { Member, Player, Pool, RoundSettings, Stats, Team, TeamPlayer } from '@/app/types';
import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';
import { uniqueNamesGenerator, Config, names, adjectives, colors, animals } from 'unique-names-generator';

const config: Config = {
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    style: 'capital'
};

const nameConfig: Config = {
    dictionaries: [names, animals],
    separator: ' ',
    style: 'capital'
};
export async function loadLeagues(user: User) {
    const client = await createClient();
    const members = await client.from('league_members').select('*').eq('email', user?.email);
    const response = await client
        .from('league')
        .select('*, league_members(*), team(*)')
        .or(`id.in.(${members.data.map((x) => x.league_id)}), admin_id.eq.${user.id}`);
    return response;
}

export async function loadLeague(league_id: number, user: User) {
    const client = await createClient();
    const members = await client.from('league_members').select('*').eq('email', user?.email);
    const response = await client
        .from('league')
        .select('*, league_members(*), team(*)')
        .eq('id', league_id)
        .or(`id.in.(${members.data.map((x) => x.league_id)}), admin_id.eq.${user.id}`);
    return response;
}

export async function removeMember({ email, league_id }: { email: string; league_id: number }) {
    const client = await createClient();
    const response = await client.from('league_members').delete().eq('email', email).eq('league_id', league_id);
    return response;
}

export async function inviteMember({ email, league_id }: { email: string; league_id: number }) {
    const client = await createClient();
    const existing = await client.from('league_members').select('id').eq('email', email).eq('league_id', league_id);
    if (existing.data[0]) {
        return {
            error: {
                message: 'Member Already Exists'
            }
        };
    }
    const response = await client.from('league_members').insert({ email, league_id });
    return response;
}

export async function loadMembers({ league_id }: { league_id: number }) {
    const client = await createClient();
    const response = await client.from('league_members').select('*').eq('league_id', league_id);
    return response;
}

export async function loadRounds(league_id: number) {
    const client = await createClient();
    const response = await client
        .from('nfl_rounds')
        .select('*, round_settings(*), pools(*)')
        .eq('pools.league_id', league_id)
        .eq('round_settings.league_id', league_id);
    return response;
}

export async function upsertSettings(data: RoundSettings) {
    const client = await createClient();
    const response = await client.from('round_settings').upsert(
        {
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
        },
        {
            onConflict: 'round_id, league_id'
        }
    );
    return response;
}

export async function loadPools({ league_id, round_id }: { league_id: number; round_id: number }) {
    const client = await createClient();
    const request = client.from('pools').select('*').eq('league_id', league_id);
    if (round_id) {
        request.eq('round_id', round_id);
    }

    return await request;
}

export async function createPools(count: number, league_id: number, round_id: number) {
    const client = await createClient();
    const result = [];
    for (let i = 0; i < count; i++) {
        const res = await client
            .from('pools')
            .insert({
                round_id,
                league_id,
                name: uniqueNamesGenerator(config)
            })
            .select();
        result.push(res.data[0]);
    }

    return result;
}

export async function loadTeams({ pool_ids }: { pool_ids: number[] }) {
    const client = await createClient();

    const pools_response = await client.from('pools').select('*').in('id', pool_ids);
    const team_ids = pools_response.data.map((x) => x.draft_order);
    const response = await client.from('team').select('*, team_players(*, player(*))').in('id', team_ids);
    return response.data;
}

export async function assignPools({ members, pools }: { members: Member[]; pools: Pool[] }) {
    const client = await createClient();
    const loops = members.length / pools.length;
    const cloned_members = JSON.parse(JSON.stringify(members));
    const pool_map: { [pool_id: number]: number[] } = {};
    for (const member of members) {
        const existing_team = await client.from('team').select('*').eq('league_id', pools[0].league_id).eq('member_id', member.id);
        if (existing_team.data.length) {
            continue;
        }
        await client
            .from('team')
            .insert({
                member_id: member.id,
                league_id: pools[0].league_id,
                name: uniqueNamesGenerator(nameConfig)
            })
            .select();
    }
    const existing = await client.from('team').select('*').eq('league_id', pools[0].league_id);

    const teams: Team[] = existing.data;
    for (let i = 0; i < loops; i++) {
        for (let j = 0; j < pools.length; j++) {
            if (!teams.length) {
                continue;
            }
            const team_index = Math.floor(Math.random() * teams.length);
            const team = teams[team_index];
            teams.splice(team_index, 1);

            pool_map[pools[j].id] = [...(pool_map[pools[j].id] || []), team.id];
        }
    }

    for (const pool of pools) {
        if (!pool_map[pool.id]) {
            continue;
        }
        await client
            .from('pools')
            .update({
                current: pool_map[pool.id][0],
                draft_order: pool_map[pool.id]
            })
            .eq('id', pool.id);
    }
}

export async function updateName(name: string, team_id: number) {
    const client = await createClient();
    const existing = await client.from('team').select('name').eq('id', team_id);
    if (existing.data?.[0]?.name === name) {
        return;
    }
    const response = await client
        .from('team')
        .update({
            name
        })
        .eq('id', team_id);
    return response;
}

export async function loadNFLTeams() {
    const client = await createClient();
    const response = await client.from('nfl_teams').select('*');
    return response;
}

export async function loadNFLPlayers(
    query: { drafted?: boolean; pos: string; name?: string; team_ids?: number[]; round_id: string },
    pool_id: number,
    league_id: number
) {
    const client = await createClient();
    const nfl_round = await client.from('nfl_rounds').select('*').eq('id', query.round_id);
    const games = await client.from('games').select('*').eq('nfl_round_id', nfl_round.data[0].id);
    const teams = await client
        .from('nfl_team')
        .select('*')
        .in('id', games.data.map((x) => [x.nfl_team_1, x.nfl_team_2]).flat());
    const request = client
        .from('player')
        .select('*, nfl_team(*), team_players(*)')
        .in(
            'nfl_team_id',
            teams.data.map((x) => x.id)
        )
        .eq(
            'team_players.pool_id',
            pool_id
        );
    if (query.name?.length) {
        request.ilike('name', `%${query.name}%`);
    }

    if (query.team_ids?.length) {
        request.in('nfl_team_id', query.team_ids);
    }

    if (!query.name?.length && query.drafted) {
        request.not('team_players', 'is', null)
    }

    if (query.pos === 'QB') {
        request.is('is_qb', true);
    }

    if (query.pos === 'RB') {
        request.is('is_rb', true);
    }

    if (query.pos === 'WR') {
        request.is('is_wr', true);
    }

    if (query.pos === 'TE') {
        request.is('is_te', true);
    }

    if (query.pos === 'FLEX') {
        request.or('is_te.is.true, is_rb.is.true, is_wr.is.true');
    }

    if (query.pos === 'SF') {
        request.or('is_te.is.true, is_rb.is.true, is_wr.is.true, is_qb.is.true');
    }

    request.order('pick_number', { referencedTable: 'team_players', ascending: true }).limit(50);
    const response = await request;
    return response;
}

export async function loadPool(round_id: number, league_id: number) {
    const client = await createClient();
    const response = await client.from('pools').select('*').eq('round_id', round_id).eq('league_id', league_id);
    return response;
}

export async function resetPools(league_id: number) {
    const client = await createClient();
    const open_pools = await client.from('pools').select('*').eq('league_id', league_id).not('status', 'eq', 'complete')
    const response = await client.from('pools').delete().in('id', open_pools.data.map((x) => x.id));
    return response;
}

export async function loadMember(league_id: number, user: User) {
    const client = await createClient();
    const response = await client.from('league_members').select('*').eq('league_id', league_id).eq('email', user.email);

    if (response.data?.[0] && response.data?.[0]?.user_id == null) {
        await client.from('league_members').update({ user_id: user.id }).eq('id', response.data?.[0].id);
    }
    return response;
}

export async function loadTeam(league_id: number, member_id: number) {
    const client = await createClient();
    const response = await client.from('team').select('*').eq('league_id', league_id).eq('member_id', member_id);
    return response;
}

// export async function loadLeagueTeam()

export async function loadTeamPlayers(pool_id: number) {
    const client = await createClient();
    const response = await client.from('team_players').select('*').eq('pool_id', pool_id);
    return response;
}

export async function draftPlayer(
    league_id: number,
    round_id: number,
    pool_id: number,
    team_id: number,
    player_id: number
) {
    const client = await createClient();
    const player = await client.from('player').select('*').eq('id', player_id);
    const team = await client.from('team_players').select('*, player(*)').eq('team_id', team_id).eq('pool_id', pool_id);
    const settings = await client
        .from('round_settings')
        .select('*')
        .eq('round_id', round_id)
        .eq('league_id', league_id);
    const pool = await client.from('pools').select('*').eq('id', pool_id);
    if (pool.data[0].current !== team_id) {
        return {
            error: {
                message: 'Its not your turn to pick'
            }
        };
    }

    if (!settings.data[0]) {
        return {
            error: {
                message: 'Round not configured by commish yet.'
            }
        };
    }

    if (!isPickValid(player.data[0], settings.data[0], team.data)) {
        return {
            error: {
                message: "You don't have a spot for this player"
            }
        };
    }
    const curr_pick_number = pool.data[0].pick_number;
    const response = await client.from('team_players').insert({
        pool_id,
        team_id,
        player_id,
        pick_number: curr_pick_number
    });

    if (!response.error) {
        const next: number[] = pool.data[0].draft_order;
        const curr_index = next.findIndex((x) => x === team_id);
        let next_index = curr_index === next.length - 1 ? 0 : curr_index + 1;
        if (next_index === 0) {
            next.reverse();
        }
        const next_team_count =
            (await client.from('team_players').select('*').eq('pool_id', pool_id).eq('team_id', next[next_index])).data
                .length ?? 0;
        if (settings.data[0].max_team_size === next_team_count) {
            await client
                .from('pools')
                .update({ pick_number: curr_pick_number + 1, current: null, status: 'complete' })
                .eq('id', pool_id);
            return response;
        }
        const res = await client
            .from('pools')
            .update({ pick_number: curr_pick_number + 1, draft_order: next, current: next[next_index] })
            .eq('id', pool_id);
        if (res.error) {
            return res;
        }
    }

    return response;
}

function isPickValid(player: Player, round_settings: RoundSettings, team: TeamPlayer[]) {
    const team_rb_count = team.filter((x) => x.player.is_rb).length;
    const team_te_count = team.filter((x) => x.player.is_te).length;
    const team_wr_count = team.filter((x) => x.player.is_wr).length;
    const team_qb_count = team.filter((x) => x.player.is_qb).length;

    const rb_spots = round_settings.rb_count - team_rb_count;
    const te_spots = round_settings.te_count - team_te_count;
    const wr_spots = round_settings.wr_count - team_wr_count;
    const qb_spots = round_settings.qb_count - team_qb_count;

    /** overflow > 0 means room */
    if (player.is_rb && rb_spots > 0) {
        return true;
    }
    if (player.is_te && te_spots > 0) {
        return true;
    }
    if (player.is_wr && wr_spots > 0) {
        return true;
    }
    if (player.is_qb && qb_spots > 0) {
        return true;
    }

    /*** calcualte FLEX spots */
    let flex_spots = round_settings.flex_count;
    if (rb_spots < 0) {
        flex_spots = flex_spots + rb_spots;
    }

    if (te_spots < 0) {
        flex_spots = flex_spots + te_spots;
    }

    if (wr_spots < 0) {
        flex_spots = flex_spots + wr_spots;
    }

    /** if we have flex spots the pick is valid for rb, te, wr */
    if (flex_spots > 0 && (player.is_rb || player.is_te || player.is_wr)) {
        return true;
    }

    let sf_spots = round_settings.sf_count;
    if (flex_spots < 0) {
        sf_spots = sf_spots + flex_spots;
    }

    if (qb_spots < 0) {
        sf_spots = sf_spots + qb_spots;
    }

    if (sf_spots > 0) {
        return true;
    }

    if (qb_spots < 0) {
        sf_spots = sf_spots + qb_spots;
    }

    /** if we have sf spots the pick is valid */
    if (sf_spots > 0) {
        return true;
    }

    return false;
}

export async function loadPoints({ league_id, round_id }: { round_id?: number; league_id: number }) {
    const client = await createClient();
    const request = client.from('round_settings').select('*').eq('league_id', league_id);
    request.not('round_id', 'eq', -1);
    const round_settings = await request;
    const games = await client.from('games').select('*');
    const pools = await client.from('pools').select('*').eq('league_id', league_id);
    const pool_ids_by_round = pools.data.reduce((acc, curr) => {
        acc[curr.round_id] = acc[curr.round_id] ? [...acc[curr.round_id], curr.id] : [curr.id];
        return acc;
    }, {})
    const { data: teamsWithPlayers } = await client
        .from('team')
        .select('*, players:team_players(*, player(*))')
        .eq('league_id', league_id);

    const player_ids = teamsWithPlayers.map((x) => x.players.map((x) => x.player.id)).flat();
    const { data: stats } = await client.from('stats').select('*').in('player_id', player_ids);
    const games_by_id = games.data.reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
    }, {});
    const teamsWithPlayersWithStats = teamsWithPlayers
        .map((team) => {
            return {
                ...team,
                team_players: team.players.map((player) => {
                    const player_stats = stats.filter((x) => x.player_id === player.player.id).filter(x => {
                        const game = games_by_id[x.game_id];
                        const round = game.nfl_round_id
                        const pool_ids = pool_ids_by_round[round]
                        return pool_ids?.includes(player.pool_id)
                    })[0]

                    return {
                        ...player,
                        stats: player_stats,
                        score: scorePlayer(player, player_stats, round_settings.data[0]) ?? 0
                    };
                })
            };
        })
        .map((team) => {
            const poolScores = {};
            let seasonScore = 0;
            for (const player of team.team_players) {
                seasonScore += player.score;
                if (!poolScores[player.pool_id]) {
                    poolScores[player.pool_id] = player.score;
                } else {
                    poolScores[player.pool_id] += player.score;
                }
            }
            return {
                ...team,
                poolScores,
                seasonScore: parseFloat(seasonScore.toFixed(2))
            };
        });

    return teamsWithPlayersWithStats;
}

function scorePlayer(player: TeamPlayer, stats: Stats, round_settings: RoundSettings) {
    let score = 0;
    if (player.player.is_qb || player.player.is_wr) {
        score += round_settings.wr_ppr * (stats?.rec ?? 0);
    } else if (player.player.is_te) {
        score += round_settings.te_ppr * (stats?.rec ?? 0);
    } else if (player.player.is_rb) {
        score += round_settings.rb_ppr * (stats?.rec ?? 0);
    }

    score += round_settings.rec_yd * (stats?.rec_yds ?? 0);
    score += round_settings.rush_yd * (stats?.rush_yds ?? 0);
    score += round_settings.rush_td * (stats?.rush_td ?? 0);
    score += round_settings.pass_td * (stats?.pass_td ?? 0);
    score += round_settings.rec_td * (stats?.rec_td ?? 0);
    score += round_settings.pass_yd * (stats?.pass_yds ?? 0);
    score += round_settings.fum * (stats?.fum ?? 0);
    score += round_settings.int * (stats?.int ?? 0);
    score += 2 * (stats?.['2pt'] ?? 0);

    return parseFloat(score.toFixed(2));
}
