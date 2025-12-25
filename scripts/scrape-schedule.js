const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function scrapeSchedule(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const games = [];

    // Listen to console events from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    try {
        console.log(`  Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log(`  Page loaded successfully`);

        const data = await page.evaluate(() => {
            const games = [];

            // Find all rows in schedule tables
            const rows = document.querySelectorAll('tbody tr');
            console.log(`Found ${rows.length} table rows`);

            rows.forEach((row, index) => {
                // Look for date_col which contains the game link
                const dateCol = row.querySelector('.date__col.Table__TD');
                console.log(dateCol.children)
                if (!dateCol) return;

                // Get game link from date_col
                const gameLink = dateCol.querySelector('a[href*="/game/_/gameId/"]');
                if (!gameLink) {
                    console.log('no game link')
                    return;
                };

                const href = gameLink.getAttribute('href') || '';
                const gameIdMatch = href.match(/gameId\/(\d+)/);
                if (!gameIdMatch) {
                    console.log('no gameidmatch')
                    return;
                }

                const gameId = gameIdMatch[1];

                // Get teams from away_team and home_team classes
                const awayTeamEl = row.querySelector('.Table__Team.away');

                const homeTeamEl = row.querySelector('.Table__Team:not(.away)');
                if (!awayTeamEl || !homeTeamEl) {
                    console.log('missing teams')
                    return;
                }

                const awayTeam = awayTeamEl.textContent?.trim() || '';
                const homeTeam = homeTeamEl.textContent?.trim() || '';

                // Skip if either team is TBD
                if (awayTeam.includes('TBD') || homeTeam.includes('TBD')) {
                    console.log('tbd')
                    return;
                }

                // Get time from the game link text
                let timeText = gameLink.textContent?.trim() || '';

                // Try to find the date - look upward for table caption
                let dateText = '';
                const table = row.closest('table');
                if (table) {
                    const caption = table.querySelector('.Table__Title');
                    dateText = caption?.textContent?.trim() || '';
                }

                if (gameId && awayTeam && homeTeam) {
                    games.push({
                        team1: awayTeam,
                        team2: homeTeam,
                        gameId,
                        timeText,
                        dateText
                    });
                }
            });

            console.log(`Found ${games.length} games from ${rows.length} rows`);
            return games;
        });

        games.push(...data);
    } finally {
        await browser.close();
    }

    return games;
}

function parseGameDateTime(dateText, timeText) {
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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    if (!supabaseKey) {
        console.error('Error: SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
        process.exit(1);
    }

    console.log('Using Supabase URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Weeks to scrape: 17, 18 (regular season) and playoff rounds
    // Note: Week 17/18 are part of the 2024 season but occur in 2025
    const scheduleConfigs = [
        { week: 17, round: -2, year: 2025 },  // Week 17 (Dec 2024/Jan 2025)
        { week: 18, round: -1, year: 2025 },  // Week 18 (Jan 2025)
        { week: 1, round: 2, year: 2025, seasonType: 3 },   // Wildcard
        { week: 2, round: 3, year: 2025, seasonType: 3 },   // Divisional
        { week: 3, round: 4, year: 2025, seasonType: 3 },   // Conference
    ];

    let totalGamesAdded = 0;

    try {
        console.log('Starting schedule scrape...');

        for (const config of scheduleConfigs) {
            // Build URL - playoffs use seasontype=3
            const baseUrl = `https://www.espn.com/nfl/schedule/_/week/${config.week}/year/${config.year}`;
            const url = config.seasonType ? `${baseUrl}/seasontype/${config.seasonType}` : baseUrl;

            console.log(`\nScraping ${url}...`);

            // Get the round from database
            const { data: rounds } = await supabase
                .from('nfl_rounds')
                .select('*')
                .eq('round', config.round)
                .eq('year', config.year);

            if (!rounds || rounds.length === 0) {
                console.log(`Round ${config.round} for year ${config.year} not found in database, skipping`);
                continue;
            }

            const round = rounds[0];

            // Add delay to avoid rate limiting
            await delay(2000);

            const games = await scrapeSchedule(url);
            console.log(`Found ${games.length} games for week ${config.week} (round ${config.round})`);

            for (const game of games) {
                const startTime = parseGameDateTime(game.dateText, game.timeText);

                // Find team IDs by name - try to match team names flexibly
                const { data: allTeams } = await supabase
                    .from('nfl_team')
                    .select('*');

                if (!allTeams || allTeams.length === 0) {
                    console.log(`No teams found in database`);
                    continue;
                }

                // Helper function to match team names
                const findTeam = (teamName) => {
                    const lowerName = teamName.toLowerCase();
                    return allTeams.find(t =>
                        t.name.toLowerCase().includes(lowerName) ||
                        lowerName.includes(t.name.toLowerCase()) ||
                        (t.city && lowerName.includes(t.city.toLowerCase()))
                    );
                };

                const team1 = findTeam(game.team1);
                const team2 = findTeam(game.team2);

                if (!team1 || !team2) {
                    console.log(`Could not match teams: "${game.team1}" vs "${game.team2}"`);
                    continue;
                }

                // Check if game already exists
                const { data: existingGames } = await supabase
                    .from('games')
                    .select('*')
                    .eq('link', game.gameId);

                if (existingGames && existingGames.length > 0) {
                    console.log(`Game ${game.gameId} already exists, skipping`);
                    continue;
                }

                // Insert game
                const { error } = await supabase
                    .from('games')
                    .insert({
                        nfl_team_1: team1.id,
                        nfl_team_2: team2.id,
                        link: game.gameId,
                        start_time: startTime.toISOString(),
                        nfl_round_id: round.id,
                        is_final: false
                    });

                if (error) {
                    console.error(`Error inserting game: ${error.message}`);
                } else {
                    console.log(`✓ Added game: ${team1.name} vs ${team2.name} (${game.gameId})`);
                    totalGamesAdded++;
                }
            }
        }

        console.log('\n=== Schedule Scrape Complete ===');
        console.log(`Total games added: ${totalGamesAdded}`);

    } catch (error) {
        console.error('Scrape failed:', error);
        process.exit(1);
    }
}

main();
