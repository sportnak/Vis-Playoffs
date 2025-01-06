'use server'

import { Member, Pool, RoundSettings } from "@/app/types";
import { createClient } from "@/utils/supabase/server";
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

export async function loadRounds({ league_id }: { league_id: number }) {
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
        console.log('pool')
        const res = await client.from('pools').insert({
            round_id,
            league_id,
            name: uniqueNamesGenerator(config)
        });
        console.log(res)
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
            });
            console.log(r)
        }
    }
}