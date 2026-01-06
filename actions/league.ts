'use server';

import { Member, Player, Pool, RoundSettings, Stats, Team, TeamPlayer } from '@/app/types';
import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';
import { uniqueNamesGenerator, Config, names, adjectives, colors, animals } from 'unique-names-generator';
import { getPlayerPosition, isFlexEligible, isSuperFlexEligible } from '@/utils/player-position';

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

export async function loadLeague(league_id: string, user: User) {
    const client = await createClient();
    const members = await client.from('league_members').select('*').eq('email', user?.email);
    const response = await client
        .from('league')
        .select('*, league_members(*), team(*)')
        .eq('id', league_id)
        .or(`id.in.(${members.data.map((x) => x.league_id)}), admin_id.eq.${user.id}`);
    return response;
}

export async function createLeague({
    name,
    description,
    member_emails
}: {
    name: string;
    description?: string;
    member_emails?: string[]
}) {
    const client = await createClient();

    // Get current authenticated user
    const { data: { user }, error: userError } = await client.auth.getUser();

    if (userError || !user) {
        return {
            error: {
                message: 'User not authenticated'
            }
        };
    }

    // Validate league name
    const trimmedName = name.trim();
    if (!trimmedName) {
        return {
            error: {
                message: 'League name is required'
            }
        };
    }

    // Create the league
    const { data: league, error: leagueError } = await client
        .from('league')
        .insert({
            name: trimmedName,
            description: description?.trim() || null,
            admin_id: user.id
        })
        .select()
        .single();

    if (leagueError) {
        return {
            error: {
                message: leagueError.message || 'Failed to create league'
            }
        };
    }

    // Create a member for the league admin
    const { error: adminMemberError } = await client
        .from('league_members')
        .insert({
            email: user.email,
            league_id: league.id,
            user_id: user.id,
            status: 'active' as const
        });

    if (adminMemberError) {
        console.error('Failed to create admin member:', adminMemberError);
        // Continue even if this fails - the admin can still access the league
    }

    // Add member invitations if provided
    if (member_emails && member_emails.length > 0) {
        // Filter out empty emails and duplicates, and exclude admin's email
        const validEmails = [...new Set(
            member_emails
                .map(email => email.trim())
                .filter(email => email.length > 0 && email !== user.email)
        )];

        if (validEmails.length > 0) {
            const memberInserts = validEmails.map(email => ({
                email,
                league_id: league.id,
                status: 'pending' as const
            }));

            const { error: membersError } = await client
                .from('league_members')
                .insert(memberInserts);

            // Non-fatal error - league was created successfully
            if (membersError) {
                console.error('Failed to add some members:', membersError);
            }
        }
    }

    return { data: league };
}

export async function updateLeague({
    league_id,
    name,
    description
}: {
    league_id: string;
    name?: string;
    description?: string;
}) {
    const client = await createClient();

    // Get current authenticated user
    const { data: { user }, error: userError } = await client.auth.getUser();

    if (userError || !user) {
        return {
            error: {
                message: 'User not authenticated'
            }
        };
    }

    // Verify user is the league admin
    const { data: league } = await client
        .from('league')
        .select('admin_id')
        .eq('id', league_id)
        .single();

    if (!league || league.admin_id !== user.id) {
        return {
            error: {
                message: 'Only league admins can update league settings'
            }
        };
    }

    // Build update object (only include provided fields)
    const updates: any = {};

    if (name !== undefined) {
        const trimmedName = name.trim();
        if (!trimmedName) {
            return {
                error: {
                    message: 'League name cannot be empty'
                }
            };
        }
        updates.name = trimmedName;
    }

    if (description !== undefined) {
        updates.description = description.trim() || null;
    }

    // Perform update
    const { data, error } = await client
        .from('league')
        .update(updates)
        .eq('id', league_id)
        .select()
        .single();

    if (error) {
        return {
            error: {
                message: error.message || 'Failed to update league'
            }
        };
    }

    return { data };
}

export async function removeMember({ email, league_id }: { email: string; league_id: string }) {
    const client = await createClient();
    const response = await client.from('league_members').delete().eq('email', email).eq('league_id', league_id);
    return response;
}

export async function inviteMember({ email, league_id }: { email: string; league_id: string }) {
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

export async function loadMembers({ league_id }: { league_id: string }) {
    const client = await createClient();
    const response = await client.from('league_members').select('*').eq('league_id', league_id);
    return response;
}

export async function loadRounds(league_id: string) {
    const client = await createClient();
    const response = await client
        .from('nfl_rounds')
        .select('*, round_settings(*), pools(*)')
        .gt('round', 0)
        .eq('pools.league_id', league_id)
        .eq('round_settings.league_id', league_id);
    return response;
}

export async function getCurrentRound() {
    const client = await createClient();

    // Get the current date and time
    const now = new Date();

    // Calculate the start of this week (last Tuesday at 00:00:00)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    let daysFromLastTuesday;
    if (dayOfWeek >= 2) {
        // If today is Tuesday or later, go back to this week's Tuesday
        daysFromLastTuesday = dayOfWeek - 2;
    } else {
        // If today is Sunday or Monday, go back to last week's Tuesday
        daysFromLastTuesday = dayOfWeek + 5; // +5 to go back to previous Tuesday
    }
    startOfWeek.setDate(now.getDate() - daysFromLastTuesday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate the end of this week (next Tuesday at 23:59:59)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7); // Add 7 days to get next Tuesday
    endOfWeek.setHours(23, 59, 59, 999);

    // Get games that fall in this week's window
    const { data: gamesThisWeek } = await client
        .from('games')
        .select('nfl_round_id, nfl_rounds(*)')
        .gte('start_time', startOfWeek.toISOString())
        .lt('start_time', endOfWeek.toISOString())
        .order('start_time', { ascending: true })
        .limit(1);

    if (gamesThisWeek && gamesThisWeek.length > 0) {
        // Return the round of the first game this week
        return {
            data: gamesThisWeek[0].nfl_rounds,
            error: null
        };
    }

    // If no games this week, find the next upcoming game
    const { data: nextGame } = await client
        .from('games')
        .select('nfl_round_id, nfl_rounds(*)')
        .gte('start_time', now.toISOString())
        .order('start_time', { ascending: true })
        .limit(1);

    if (nextGame && nextGame.length > 0) {
        return {
            data: nextGame[0].nfl_rounds,
            error: null
        };
    }

    // If no future games, get the most recent past game
    const { data: recentGame } = await client
        .from('games')
        .select('nfl_round_id, nfl_rounds(*)')
        .lte('start_time', now.toISOString())
        .order('start_time', { ascending: false })
        .limit(1);

    if (recentGame && recentGame.length > 0) {
        return {
            data: recentGame[0].nfl_rounds,
            error: null
        };
    }

    // If no games found at all, return null
    return {
        data: null,
        error: null
    };
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

export async function loadPools({ league_id, round_id }: { league_id: string; round_id?: string }) {
    const client = await createClient();
    const request = client.from('pools').select('*').eq('league_id', league_id);
    if (round_id) {
        request.eq('round_id', round_id);
    }

    return await request;
}

export async function createPools(count: number, league_id: string, round_id: string) {
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
        console.log(res)
        result.push(res.data[0]);
    }

    return result;
}

export async function loadTeams({ pool_ids }: { pool_ids: string[] }) {
    const client = await createClient();

    const pools_response = await client.from('pools').select('*').in('id', pool_ids);
    const team_ids = pools_response.data.map((x) => x.draft_order);
    const response = await client.from('team').select('*, team_players(*, player(*))').in('id', team_ids);
    return response.data;
}

export async function assignPools({
    members,
    pool_count,
    league_id,
    round_id
}: {
    members: Member[];
    pool_count: number;
    league_id: string;
    round_id: string;
}) {
    const client = await createClient();

    // Create pools
    const pools: Pool[] = [];
    for (let i = 0; i < pool_count; i++) {
        const res = await client
            .from('pools')
            .insert({
                round_id,
                league_id,
                name: uniqueNamesGenerator(config)
            })
            .select();
        if (res.data && res.data[0]) {
            pools.push(res.data[0]);
        }
    }

    const loops = members.length / pools.length;
    const pool_map: { [pool_id: string]: string[] } = {};

    // Create teams using member email as name
    for (const member of members) {
        const existing_team = await client.from('team').select('*').eq('league_id', league_id).eq('member_id', member.id);
        if (existing_team.data.length) {
            continue;
        }
        // Extract name from email (part before @) or use full email
        const teamName = member.email.split('@')[0];
        await client
            .from('team')
            .insert({
                member_id: member.id,
                league_id: league_id,
                name: teamName
            })
            .select();
    }

    const existing = await client.from('team').select('*').eq('league_id', league_id);
    const teams: Team[] = existing.data;

    // Randomly assign teams to pools
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

    // Update pools with draft order
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

export async function updateName(name: string, team_id: string) {
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
    query: { drafted?: boolean; pos: string; name?: string; team_ids?: string[]; round_id: string },
    pool_id: string,
    league_id: string
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
        .select('*, nfl_team(*), team_players(*, team(name))')
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

    // Position filtering using position enum
    if (query.pos === 'QB') {
        request.eq('position', 'QB');
    }

    if (query.pos === 'RB') {
        request.eq('position', 'RB');
    }

    if (query.pos === 'WR') {
        request.eq('position', 'WR');
    }

    if (query.pos === 'TE') {
        request.eq('position', 'TE');
    }

    if (query.pos === 'FLEX') {
        request.in('position', ['RB', 'WR', 'TE']);
    }

    if (query.pos === 'SF') {
        request.in('position', ['QB', 'RB', 'WR', 'TE']);
    }

    request
        .order('pick_number', { referencedTable: 'team_players', ascending: false })
        .order('depth_rank', { ascending: true })
        .limit(50);
    const response = await request;
    return response;
}

export async function loadPool(round_id: string, league_id: string) {
    const client = await createClient();
    const response = await client.from('pools').select('*').eq('round_id', round_id).eq('league_id', league_id);
    return response;
}

export async function resetPools(league_id: string) {
    const client = await createClient();
    const open_pools = await client.from('pools').select('*').eq('league_id', league_id).not('status', 'eq', 'complete')
    const response = await client.from('pools').delete().in('id', open_pools.data.map((x) => x.id));
    return response;
}

export async function loadMember(league_id: string, user: User) {
    const client = await createClient();
    const response = await client.from('league_members').select('*').eq('league_id', league_id).eq('email', user.email);

    if (response.data?.[0] && response.data?.[0]?.user_id == null) {
        await client.from('league_members').update({ user_id: user.id }).eq('id', response.data?.[0].id);
    }
    return response;
}

export async function loadTeam(league_id: string, member_id: string) {
    const client = await createClient();
    const response = await client.from('team').select('*').eq('league_id', league_id).eq('member_id', member_id);
    return response;
}

// export async function loadLeagueTeam()

export async function loadTeamPlayers(pool_id: string) {
    const client = await createClient();
    const response = await client.from('team_players').select('*').eq('pool_id', pool_id);
    return response;
}

export async function draftPlayer(
    league_id: string,
    round_id: string,
    pool_id: string,
    team_id: string,
    player_id: string
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
        const next: string[] = pool.data[0].draft_order;
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
    const playerPosition = getPlayerPosition(player);

    // Count players by position using helper
    const team_rb_count = team.filter((x) => getPlayerPosition(x.player) === 'RB').length;
    const team_te_count = team.filter((x) => getPlayerPosition(x.player) === 'TE').length;
    const team_wr_count = team.filter((x) => getPlayerPosition(x.player) === 'WR').length;
    const team_qb_count = team.filter((x) => getPlayerPosition(x.player) === 'QB').length;

    const rb_spots = round_settings.rb_count - team_rb_count;
    const te_spots = round_settings.te_count - team_te_count;
    const wr_spots = round_settings.wr_count - team_wr_count;
    const qb_spots = round_settings.qb_count - team_qb_count;

    /** overflow > 0 means room */
    if (playerPosition === 'RB' && rb_spots > 0) {
        return true;
    }
    if (playerPosition === 'TE' && te_spots > 0) {
        return true;
    }
    if (playerPosition === 'WR' && wr_spots > 0) {
        return true;
    }
    if (playerPosition === 'QB' && qb_spots > 0) {
        return true;
    }

    /*** calculate FLEX spots */
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
    if (flex_spots > 0 && isFlexEligible(player)) {
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

export async function loadPoints({ league_id, round_id }: { round_id?: string; league_id: string }) {
    const client = await createClient();
    const request = client.from('round_settings').select('*').eq('league_id', league_id).eq('round_id', round_id);
    const round_settings = await request;
    const games = await client.from('games').select('*');
    const pools = await client.from('pools').select('*').eq('league_id', league_id);
    const pool_ids_by_round = pools.data.reduce((acc, curr) => {
        acc[curr.round_id] = acc[curr.round_id] ? [...acc[curr.round_id], curr.id] : [curr.id];
        return acc;
    }, {})

    const poolsById = pools.data.reduce((acc, curr) => ({
        ...acc,
        [curr.id]: curr,
    }), {})

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

    // Get all round settings for the league to calculate scores for all rounds
    const { data: allRoundSettings } = await client
        .from('round_settings')
        .select('*')
        .eq('league_id', league_id);

    const roundSettingsByRound = allRoundSettings?.reduce((acc, curr) => {
        acc[curr.round_id] = curr;
        return acc;
    }, {}) || {};

    const teamsWithPlayersWithStats = teamsWithPlayers
        .map((team) => {
            return {
                ...team,
                team_players: team.players.map((player) => {
                    // Get ALL stats for this player across all games in relevant rounds
                    const player_all_stats = stats.filter((x) => x.player_id === player.player.id).filter(x => {
                        const game = games_by_id[x.game_id];
                        const round = game.nfl_round_id
                        const pool_ids = pool_ids_by_round[round]
                        return pool_ids?.includes(player.pool_id)
                    });

                    // Calculate cumulative score across all games
                    let totalScore = 0;
                    for (const stat of player_all_stats) {
                        const game = games_by_id[stat.game_id];
                        const playerRoundSettings = game ? roundSettingsByRound[game.nfl_round_id] : round_settings.data?.[0];
                        totalScore += scorePlayer(player, stat, playerRoundSettings) ?? 0;
                    }

                    // For display purposes, use the first stat (or null if no stats)
                    const player_stats = player_all_stats[0] || null;

                    return {
                        ...player,
                        stats: player_stats,
                        score: parseFloat(totalScore.toFixed(2))
                    };
                })
            };
        })
        .map((team) => {
            const poolScores = {};
            const roundScores = {}
            let seasonScore = 0;
            for (const player of team.team_players) {
                seasonScore += player.score;
                const poolId = player.pool_id ?? 0
                const pool = !player.pool_id ? pools.data[0] : poolsById[poolId]
                if (!poolScores[poolId]) {
                    roundScores[pool?.round_id] = player.score
                    poolScores[poolId] = player.score;
                } else {
                    roundScores[pool?.round_id] += player.score
                    poolScores[poolId] += player.score;
                }
            }

            return {
                ...team,
                roundScores,
                poolScores,
                seasonScore: parseFloat(seasonScore.toFixed(2))
            };
        });

    return teamsWithPlayersWithStats;
}

function scorePlayer(player: TeamPlayer, stats: Stats, round_settings?: RoundSettings) {
    let score = 0;
    const position = getPlayerPosition(player.player);
    if (!round_settings) {
        return 0;
    }

    // Apply position-specific PPR scoring
    if (position === 'QB' || position === 'WR') {
        score += round_settings.wr_ppr * (stats?.rec ?? 0);
    } else if (position === 'TE') {
        score += round_settings.te_ppr * (stats?.rec ?? 0);
    } else if (position === 'RB') {
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
