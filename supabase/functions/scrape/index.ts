import puppeteer from 'puppeteer';
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

        teams.forEach((team) => {
            const title = team.querySelector('.TeamTitle__Name')?.textContent || '';
            console.log(title);

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

console.log(Deno.env.get('SUPABASE_URL'));

Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ??
            '',
        {
            global: { headers: { Authorization: authHeader } }
        }
    );

    const body = await req.json();
    const { game_id } = body;
    const game = await supabaseClient.from('games').select('*').eq('id', game_id).single();
    const data = await scrape(game.data.link);
    for (const player_name in data) {
        const existing_player = await supabaseClient
            .from('player')
            .select('*, stats(*)')
            .eq('stats.game_id', game_id)
            .eq('name', player_name)
            .single();
        if (existing_player.status === 406) {
            continue;
        }
        if (existing_player.data.stats.length > 0) {
            await supabaseClient
                .from('stats')
                .update(mapStats(data[player_name].Stats))
                .eq('game_id', game_id)
                .eq('player_id', existing_player.data.id);
        } else {
            await supabaseClient
                .from('stats')
                .insert({
                    ...mapStats(data[player_name].Stats),
                    player_id: existing_player.data.id,
                    game_id
                })
                .eq('game_id', game_id)
                .eq('player_id', existing_player.data.id);
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
            return {
                [stat.RUSH ? 'rush_yds' : stat.PASS ? 'pass_yds' : stat.REC ? 'rec_yds' : '']: stat.Value
            };
        case 'TD':
            return {
                [stat.RUSH ? 'rush_td' : stat.PASS ? 'pass_td' : stat.REC ? 'rec_td' : '']: stat.Value
            };
        case 'CAR':
            return {
                rush_att: stat.Value
            };
        case 'INT':
            return {
                int: stat.Value
            };
        case 'FUM':
            return {
                fum: stat.Value
            };
    }
}
