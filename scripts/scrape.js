const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function scrape(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const athletesData = {};

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const data = await page.evaluate(() => {
        const athletesData = {};
        const teams = document.querySelectorAll('div.Boxscore__Team');
        const is_final = document.querySelectorAll('.Gamestrip__Container');
        if (is_final.length > 0 && is_final[0].textContent.includes('Final')) {
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
                    const statData = {
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

    await browser.close();
    return data;
}

function mapStats(stats) {
    return stats.reduce(
        (acc, stat) => ({
            ...acc,
            ...mapProp(stat)
        }),
        {}
    );
}

function mapProp(stat) {
    switch (stat.Key) {
        case 'C/ATT':
            const [cmp, att] = stat.Value.split('/');
            return {
                pass_att: att,
                comp: cmp
            };
        case 'YDS':
            if (!stat.RUSH && !stat.PASS && !stat.REC) {
                return {};
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
                return {};
            }
            return {
                rec: stat.Value
            };
        case 'TGTS':
            return {
                tar: stat.Value
            };
        default:
            return {};
    }
}

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    if (!supabaseKey) {
        console.error('Error: SUPABASE_ANON_KEY must be set in .env.local');
        process.exit(1);
    }

    console.log('Using Supabase URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('Starting game stats scrape...');

        const { data: games, error: gamesError } = await supabase
            .from('games')
            .select('*')
            .lt('start_time', new Date(Date.now()).toISOString())
            .eq('is_final', false)
            .not('link', 'eq', '')
            .order('start_time', { ascending: true });

        if (gamesError) {
            console.error('Error fetching games:', gamesError);
            process.exit(1);
        }

        console.log(`Found ${games.length} games to scrape`);

        for (const game of games) {
            const { data: teams } = await supabase
                .from('nfl_team')
                .select('*')
                .in('id', [game.nfl_team_1, game.nfl_team_2]);

            console.log(`\nScraping ${teams[0].name} vs ${teams[1].name} (${game.start_time})`);

            const data = await scrape(`https://www.espn.com/nfl/boxscore/_/gameId/${game.link}`);
            const is_final = data['Final'] != null;

            if (is_final) {
                delete data['Final'];
                const { error: updateError } = await supabase
                    .from('games')
                    .update({ is_final: true })
                    .eq('id', game.id);

                if (updateError) {
                    console.error(`Error updating game final status: ${updateError.message}`);
                } else {
                    console.log('  ✓ Game marked as final');
                }
            }

            for (const player_name in data) {
                const { data: existing_player, status } = await supabase
                    .from('player')
                    .select('*, stats(*)')
                    .eq('stats.game_id', game.id)
                    .eq('name', player_name)
                    .single();

                if (status === 406) {
                    console.log(`  ⚠ Multiple players found for ${player_name}, skipping`);
                    continue;
                }

                if (!existing_player) {
                    console.log(`  ⚠ Player not found: ${player_name}`);
                    continue;
                }

                if (existing_player.stats && existing_player.stats.length > 0) {
                    const { error: updateError } = await supabase
                        .from('stats')
                        .update(mapStats(data[player_name].Stats))
                        .eq('game_id', game.id)
                        .eq('player_id', existing_player.id);

                    if (updateError) {
                        console.error(`  Error updating stats for ${player_name}: ${updateError.message}`);
                    } else {
                        console.log(`  ✓ Updated stats for ${player_name}`);
                    }
                } else {
                    const { error: insertError } = await supabase
                        .from('stats')
                        .insert({
                            ...mapStats(data[player_name].Stats),
                            player_id: existing_player.id,
                            game_id: game.id
                        });

                    if (insertError) {
                        console.error(`  Error inserting stats for ${player_name}: ${insertError.message}`);
                    } else {
                        console.log(`  ✓ Inserted stats for ${player_name}`);
                    }
                }
            }
        }

        console.log('\n=== Game Stats Scrape Complete ===');

    } catch (error) {
        console.error('Scrape failed:', error);
        process.exit(1);
    }
}

main();
