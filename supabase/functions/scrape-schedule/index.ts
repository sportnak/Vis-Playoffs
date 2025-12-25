import puppeteer from 'npm:puppeteer';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface GameData {
    team1: string;
    team2: string;
    gameId: string;
    startTime: Date;
    date: string;
}

async function scrapeSchedule(url: string): Promise<GameData[]> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const games: GameData[] = [];

    await page.goto(url, { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
        const games: any[] = [];

        // Find all schedule tables (one per day)
        const tables = document.querySelectorAll('div.ScheduleTables div.ResponsiveTable');

        tables.forEach((table) => {
            // Get the date from the table caption
            const caption = table.querySelector('.Table__Title');
            const dateText = caption?.textContent?.trim() || '';

            // Find all game rows
            const rows = table.querySelectorAll('tbody tr');

            rows.forEach((row) => {
                // Get team links
                const teamLinks = row.querySelectorAll('td:first-child a.AnchorLink');
                if (teamLinks.length !== 2) return;

                const team1Text = teamLinks[0].textContent?.trim() || '';
                const team2Text = teamLinks[1].textContent?.trim() || '';

                // Skip if either team is TBD
                if (team1Text.includes('TBD') || team2Text.includes('TBD')) {
                    return;
                }

                // Extract team names (remove @ symbol if present)
                const team1 = team1Text.replace('@', '').trim();
                const team2 = team2Text.replace('@', '').trim();

                // Get game link and extract gameId
                const gameLink = row.querySelector('a[href*="/game/_/gameId/"]');
                const href = gameLink?.getAttribute('href') || '';
                const gameIdMatch = href.match(/gameId\/(\d+)/);
                const gameId = gameIdMatch ? gameIdMatch[1] : '';

                // Get game time
                const timeCell = row.querySelector('td:nth-child(2)');
                const timeText = timeCell?.textContent?.trim() || '';

                if (gameId && team1 && team2) {
                    games.push({
                        team1,
                        team2,
                        gameId,
                        timeText,
                        dateText
                    });
                }
            });
        });

        return games;
    });

    await browser.close();
    return data.map(game => {
        // Parse the date and time
        const startTime = parseGameDateTime(game.dateText, game.timeText);

        return {
            team1: game.team1,
            team2: game.team2,
            gameId: game.gameId,
            startTime,
            date: game.dateText
        };
    });
}

function parseGameDateTime(dateText: string, timeText: string): Date {
    // ESPN schedule dates are like "Thursday, December 26" or "Saturday, December 28"
    // Times are like "1:00 PM" or "4:30 PM"

    const currentYear = new Date().getFullYear();

    // Extract month and day from dateText
    const dateMatch = dateText.match(/(\w+),\s+(\w+)\s+(\d+)/);
    if (!dateMatch) {
        return new Date();
    }

    const [_, dayOfWeek, month, day] = dateMatch;

    // Parse time
    const timeMatch = timeText.match(/(\d+):(\d+)\s+(AM|PM)/);
    if (!timeMatch) {
        return new Date(`${month} ${day}, ${currentYear}`);
    }

    const [__, hourStr, minuteStr, meridiem] = timeMatch;
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    if (meridiem === 'PM' && hour !== 12) {
        hour += 12;
    } else if (meridiem === 'AM' && hour === 12) {
        hour = 0;
    }

    // Create date in EST (NFL games are typically shown in ET)
    const dateStr = `${month} ${day}, ${currentYear} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00 GMT-0500`;
    return new Date(dateStr);
}

Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
            global: { headers: { Authorization: authHeader } }
        }
    );

    // Weeks to scrape: 17, 18 (regular season) and playoff rounds
    const scheduleConfigs = [
        { week: 17, round: -2, year: 2024 },  // Week 17
        { week: 18, round: -1, year: 2024 },  // Week 18
        { week: 1, round: 2, year: 2025, seasonType: 3 },   // Wildcard
        { week: 2, round: 3, year: 2025, seasonType: 3 },   // Divisional
        { week: 3, round: 4, year: 2025, seasonType: 3 },   // Conference
    ];

    let totalGamesAdded = 0;

    for (const config of scheduleConfigs) {
        // Build URL - playoffs use seasontype=3
        const baseUrl = `https://www.espn.com/nfl/schedule/_/week/${config.week}/year/${config.year}`;
        const url = config.seasonType ? `${baseUrl}/seasontype/${config.seasonType}` : baseUrl;

        console.log(`Scraping ${url}...`);

        // Get the round from database
        const { data: rounds } = await supabaseClient
            .from('nfl_rounds')
            .select('*')
            .eq('round', config.round)
            .eq('year', config.year);

        if (!rounds || rounds.length === 0) {
            console.log(`Round ${config.round} for year ${config.year} not found in database, skipping`);
            continue;
        }

        const round = rounds[0];

        try {
            const games = await scrapeSchedule(url);
            console.log(`Found ${games.length} games for week ${config.week} (round ${config.round})`);

            for (const game of games) {
                // Find team IDs by name
                const { data: teams } = await supabaseClient
                    .from('nfl_team')
                    .select('*')
                    .or(`name.ilike.%${game.team1}%,name.ilike.%${game.team2}%`);

                if (!teams || teams.length !== 2) {
                    console.log(`Could not find both teams: ${game.team1} vs ${game.team2}`);
                    continue;
                }

                const team1 = teams.find(t => game.team1.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(game.team1.toLowerCase()));
                const team2 = teams.find(t => game.team2.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(game.team2.toLowerCase()));

                if (!team1 || !team2) {
                    console.log(`Could not match teams: ${game.team1} vs ${game.team2}`);
                    continue;
                }

                // Check if game already exists
                const { data: existingGames } = await supabaseClient
                    .from('games')
                    .select('*')
                    .eq('link', game.gameId);

                if (existingGames && existingGames.length > 0) {
                    console.log(`Game ${game.gameId} already exists, skipping`);
                    continue;
                }

                // Insert game
                const { error } = await supabaseClient
                    .from('games')
                    .insert({
                        nfl_team_1: team1.id,
                        nfl_team_2: team2.id,
                        link: game.gameId,
                        start_time: game.startTime.toISOString(),
                        nfl_round_id: round.id,
                        is_final: false
                    });

                if (error) {
                    console.error(`Error inserting game: ${error.message}`);
                } else {
                    console.log(`Added game: ${game.team1} vs ${game.team2} (${game.gameId})`);
                    totalGamesAdded++;
                }
            }
        } catch (error) {
            console.error(`Error scraping ${url}:`, error);
        }
    }

    return new Response(JSON.stringify({
        success: true,
        gamesAdded: totalGamesAdded
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
});
