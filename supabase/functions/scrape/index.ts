import puppeteer from 'npm:puppeteer';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// dotenv.config({ path: '.env.local' });

interface StatData {
    Key: string;
    Value: string;
    RUSH: boolean;
    PASS: boolean;
    REC: boolean;
}

interface Athlete {
    Name: string;
    Stats: StatData[];
}

async function scrape(url: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const athletesData: Record<string, Athlete> = {};

    await page.goto(url);

    const data = await page.evaluate(() => {
        const athletesData: Record<string, { Name: string; Stats: StatData[] }> = {};
        const teams = document.querySelectorAll('div.Boxscore__Team');
        const is_final = document.querySelectorAll('div.ScoreCell__Time.Gamestrip__Time.ScoreCell__Time--post');
        if (is_final.length > 0 && is_final[0].textContent === 'Final') {
            athletesData['Final'] = { Name: 'Final', Stats: [] };
        }

        teams.forEach((team) => {
            const title = team.querySelector('.TeamTitle__Name')?.textContent || '';

            const isPassing = title.includes('Passing');
            const isRushing = title.includes('Rushing');
            const isReceiving = title.includes('Receiving');

            const playerNames = Array.from(team.querySelectorAll('a.Boxscore__Athlete_Name')).map(
                (el) => el.textContent || ''
            );
            if (playerNames.length === 0) return;

            const headers = Array.from(team.querySelectorAll('div.Table__Scroller th')).map(
                (el) => el.textContent || ''
            );
            if (headers.length === 0) return;

            const playerStats = team.querySelectorAll('div.Table__Scroller tbody tr');
            playerStats.forEach((row, index) => {
                if (index >= playerNames.length) return;

                const player = playerNames[index];
                if (!athletesData[player]) {
                    athletesData[player] = { Name: player, Stats: [] };
                }

                const values = row.querySelectorAll('td');
                values.forEach((valueElement, statIndex) => {
                    const key = headers[statIndex];
                    const statData: StatData = {
                        Key: key,
                        Value: valueElement.textContent || '',
                        RUSH: isRushing,
                        PASS: isPassing,
                        REC: isReceiving
                    };
                    athletesData[player].Stats.push(statData);
                });
            });
        });

        return athletesData;
    });

    // console.log('Scraping complete:', data['Lamar Jackson'].Stats);
    await browser.close();
    return data;
}

// scrape()

Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? 'https://ulewuloececgqzwzrepa.supabase.co',
        Deno.env.get('SUPABASE_ANON_KEY') ??
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZXd1bG9lY2VjZ3F6d3pyZXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMzIzNDEsImV4cCI6MjA1MTYwODM0MX0.pTaSyWKxxBZ8KKfAZ1BImawDneA-7bhi-m3XYQZyMO0',
        {
            global: { headers: { Authorization: authHeader } }
        }
    );

    const games = await supabaseClient
        .from('games')
        .select('*')
        .lt('start_time', new Date(Date.now()).toISOString())
        .eq('is_final', false)
        .not('link', 'eq', '')
        .order('start_time', { ascending: true });
    for (const game of games.data) {
        const teams = await supabaseClient.from('nfl_team').select('*').in('id', [game.nfl_team_1, game.nfl_team_2]);
        console.log(`Scraping ${teams.data[0].name} vs ${teams.data[1].name} (${game.start_time})`);
        const data = await scrape(`https://www.espn.com/nfl/boxscore/_/gameId/${game.link}`);
        const is_final = data['Final'] != null;
        if (is_final) {
            delete data['Final']
            await supabaseClient.from('games').update({ is_final: true }).eq('id', game.id);   
        }
        for (const player_name in data) {
            const existing_player = await supabaseClient
                .from('player')
                .select('*, stats(*)')
                .eq('stats.game_id', game.id)
                .eq('name', player_name)
                .single();
            if (existing_player.status === 406) {
                continue;
            }
            if (existing_player.data.stats.length > 0) {
                const r = await supabaseClient
                    .from('stats')
                    .update(mapStats(data[player_name].Stats))
                    .eq('game_id', game.id)
                    .eq('player_id', existing_player.data.id);
                
            } else {
                await supabaseClient
                    .from('stats')
                    .insert({
                        ...mapStats(data[player_name].Stats),
                        player_id: existing_player.data.id,
                        game_id: game.id
                    })
                    .eq('game_id', game.id)
                    .eq('player_id', existing_player.data.id);
            }
        }

    }

    return new Response('OK');
});

function mapStats(stats: any[]) {
    return stats.reduce(
        (acc, stat) => ({
            ...acc,
            ...mapProp(stat)
        }),
        {}
    );
}

function mapProp(stat: any) {
    switch (stat.Key) {
        case 'C/ATT':
            const [cmp, att] = stat.Value.split('/');
            return {
                pass_att: att,
                comp: cmp
            };
        case 'YDS':
            if (!stat.RUSH && !stat.PASS && !stat.REC) {
                return {}
            }
            return {
                [stat.RUSH ? 'rush_yds' : stat.PASS ? 'pass_yds' : stat.REC ? 'rec_yds' : '']: stat.Value
            };
        case 'TD':
            return {
                [stat.RUSH ? 'rush_td' : stat.PASS ? 'pass_td' : stat.REC ? 'rec_td' : 'rush_td']: stat.Value
            };
        case 'CAR':
            return {
                rush_att: stat.Value
            };
        case 'INT':
            return {
                int: stat.Value
            };
        case 'LOST':
            return {
                fum: stat.Value
            };
        case 'REC':
            if (!stat.RUSH && !stat.PASS && !stat.REC) {
                return {}
            }
            return {
                rec: stat.Value
            }
        case 'TGTS': 
            return {
                tar: stat.Value
            }
        default:
            return {};
    }
}
