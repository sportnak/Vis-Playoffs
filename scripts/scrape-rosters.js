const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function scrapeTeamsPage(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const teams = [];

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const teamsData = await page.evaluate(() => {
            const teams = [];

            // Find all team roster links
            const rosterLinks = Array.from(document.querySelectorAll('a[href*="/nfl/team/roster"]'));

            rosterLinks.forEach((link) => {
                const href = link.getAttribute('href');
                if (!href) return;

                // Parse URL pattern: /nfl/team/roster/_/name/{abbr}/{team-name}
                const match = href.match(/\/nfl\/team\/roster\/_\/name\/([^/]+)\/([^/]+)/);
                if (!match) return;

                const abbr = match[1];
                const teamSlug = match[2];

                // Get team name from link text or nearby elements
                let teamName = link.textContent?.trim() || '';

                // If link text is empty, try to find team name in parent container
                if (!teamName || teamName === 'Roster') {
                    const teamCard = link.closest('.TeamLinks') || link.closest('section') || link.closest('div');
                    const teamNameElement = teamCard?.querySelector('.Card__Header__Title, .TeamCard__Title, h2, h3');
                    teamName = teamNameElement?.textContent?.trim() || '';
                }

                // Fallback: convert slug to team name
                if (!teamName || teamName === 'Roster') {
                    teamName = teamSlug.split('-').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                }

                // Extract city from team name (everything before the last word)
                const nameParts = teamName.split(' ');
                const city = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : teamName;

                // Construct depth chart URL from roster URL
                // Pattern: /nfl/team/depth/_/name/{abbr}/{team-slug}
                const depthChartUrl = `/nfl/team/depth/_/name/${abbr}/${teamSlug}`;

                teams.push({
                    abbr: abbr,
                    name: teamName,
                    city: city,
                    rosterUrl: href,
                    depthChartUrl: depthChartUrl
                });
            });

            return teams;
        });

        teams.push(...teamsData);
    } finally {
        await browser.close();
    }

    // Deduplicate teams by abbreviation
    const uniqueTeams = Array.from(
        new Map(teams.map(team => [team.abbr, team])).values()
    );

    return uniqueTeams;
}

async function scrapeTeamRoster(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const players = [];

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const playersData = await page.evaluate(() => {
            const players = [];
            const skillPositions = ['QB', 'RB', 'FB', 'WR', 'TE'];

            // Find all roster tables
            const tables = Array.from(document.querySelectorAll('table'));

            tables.forEach((table) => {
                // Get table headers to find position column index
                const headers = Array.from(table.querySelectorAll('thead th')).map(
                    th => th.textContent?.trim().toUpperCase() || ''
                );

                const positionIndex = headers.findIndex(h => h === 'POS' || h === 'POSITION');
                const nameIndex = headers.findIndex(h => h === 'NAME');

                if (positionIndex === -1) return;

                // Process each row
                const rows = Array.from(table.querySelectorAll('tbody tr'));
                rows.forEach((row) => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    if (cells.length === 0) return;

                    const position = cells[positionIndex]?.textContent?.trim().toUpperCase() || '';

                    // Filter to only skill positions
                    if (!skillPositions.includes(position)) return;

                    // Get player name
                    let name = '';
                    if (nameIndex !== -1 && cells[nameIndex]) {
                        const nameLink = cells[nameIndex].querySelector('a');
                        name = nameLink?.textContent?.trim() || cells[nameIndex].textContent?.trim() || '';
                    } else {
                        const nameCell = row.querySelector('td a');
                        name = nameCell?.textContent?.trim() || '';
                    }

                    // Get headshot image URL
                    let headshotUrl = null;
                    const headshotDiv = row.querySelector('.headshot');
                    if (headshotDiv) {
                        const img = headshotDiv.querySelector('img');
                        if (img) {
                            headshotUrl = img.getAttribute('src') || null;
                        }
                    }

                    if (name) {
                        players.push({
                            name: name,
                            position: position,
                            headshot_url: headshotUrl
                        });
                    }
                });
            });

            return players;
        });

        players.push(...playersData);
    } finally {
        await browser.close();
    }

    return players;
}

async function scrapeTeamDepthChart(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const depthChart = new Map(); // Map of player name -> depth rank
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const depthData = await page.evaluate(() => {
            const depthMap = {};
            const skillPositions = ['QB', 'RB', 'FB', 'WR', 'TE'];

            // Find all depth chart tables
            const tables = Array.from(document.querySelectorAll('.Table__ScrollerWrapper'));
            tables.forEach((table) => {

                // Process each row (each row represents a position)
                const rows = Array.from(table.querySelectorAll('tbody tr'));
                rows.forEach((row) => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    if (cells.length === 0) return;

                    // Process remaining cells as depth levels (starting from index 1)
                    cells.forEach((cell, index) => {
                        const depthRank = index + 1; // 1 = starter, 2 = second string, etc.

                        // Get all player names in this cell (there might be multiple)
                        const playerLinks = Array.from(cell.querySelectorAll('a'));
                        const textContent = cell.textContent || '';

                        if (playerLinks.length > 0) {
                            playerLinks.forEach(link => {
                                let playerName = link.textContent?.trim() || '';
                                if (playerName === '-') {
                                    return;
                                }

                                // Remove status indicators like Q, IR, etc.
                                playerName = playerName.replace(/\s+(Q|IR|O|D|PUP|SUSP)$/i, '').trim();

                                if (playerName && !depthMap[playerName]) {
                                    depthMap[playerName] = depthRank;
                                }
                            });
                        } else if (textContent.trim()) {
                            // Handle plain text player names
                            const names = textContent.split(/[,\n]/).map(n => n.trim()).filter(n => n);
                            names.forEach(name => {
                                // Remove status indicators
                                name = name.replace(/\s+(Q|IR|O|D|PUP|SUSP)$/i, '').trim();

                                if (name && !depthMap[name]) {
                                    depthMap[name] = depthRank;
                                }
                            });
                        }
                    });
                });
            });

            return depthMap;
        });

        Object.entries(depthData).forEach(([name, rank]) => {
            depthChart.set(name, rank);
        });
    } finally {
        await browser.close();
    }

    return depthChart;
}

function mapPosition(espnPosition) {
    const pos = espnPosition.trim().toUpperCase();

    // Map ESPN position to our position enum
    // FB (Fullback) is treated as RB
    if (pos === 'QB') return 'QB';
    if (pos === 'RB' || pos === 'FB') return 'RB';
    if (pos === 'WR') return 'WR';
    if (pos === 'TE') return 'TE';

    return null; // Invalid position for skill positions
}

async function upsertTeam(supabase, team) {
    const { data: existing, error: selectError } = await supabase
        .from('nfl_team')
        .select('id')
        .eq('abbr', team.abbr)
        .maybeSingle();

    if (existing) {
        await supabase
            .from('nfl_team')
            .update({ name: team.name, city: team.city })
            .eq('id', existing.id);
        return existing.id;
    } else {
        const { data, error: insertError } = await supabase
            .from('nfl_team')
            .insert({
                abbr: team.abbr,
                name: team.name,
                city: team.city
            })
            .select('id')
            .single();

        if (insertError) {
            console.error(`Error inserting team ${team.name}:`, insertError);
            throw new Error(`Failed to insert team: ${insertError.message}`);
        }

        if (!data) {
            throw new Error(`Failed to insert team ${team.name}: No data returned`);
        }

        return data.id;
    }
}

async function upsertPlayer(supabase, player, teamId, depthRank = null) {
    const position = mapPosition(player.position);

    // Skip players with invalid positions
    if (!position) {
        console.log(`Skipping player ${player.name} with invalid position: ${player.position}`);
        return;
    }

    const { data: existing, error: selectError } = await supabase
        .from('player')
        .select('id')
        .eq('name', player.name)
        .eq('nfl_team_id', teamId)
        .maybeSingle();

    const playerData = {
        name: player.name,
        nfl_team_id: teamId,
        year: 2025,
        position: position,
        headshot_url: player.headshot_url,
        depth_rank: depthRank
    };

    if (existing) {
        const { error: updateError } = await supabase
            .from('player')
            .update(playerData)
            .eq('id', existing.id);

        if (updateError) {
            console.error(`Error updating player ${player.name}:`, updateError);
        }
    } else {
        const { error: insertError } = await supabase
            .from('player')
            .insert(playerData);

        if (insertError) {
            console.error(`Error inserting player ${player.name}:`, insertError);
        }
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';

    // For local development, use the local service role key
    // Get it from: supabase status (look for service_role key)
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    if (!supabaseKey) {
        console.error('Error: SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
        process.exit(1);
    }

    console.log('Using Supabase URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const failedTeams = [];
    let totalPlayersProcessed = 0;

    try {
        console.log('Starting roster scrape...');

        // Scrape teams page
        const teams = await scrapeTeamsPage('https://www.espn.com/nfl/teams');
        console.log(`Found ${teams.length} teams`);

        // Process each team
        for (const team of teams) {
            try {
                console.log(`Processing ${team.name} (${team.abbr})...`);
                if (team.name !== 'San Francisco 49ers') {
                    continue
                }

                // Upsert team
                const teamId = await upsertTeam(supabase, team);

                // Add delay to avoid rate limiting
                await delay(1500);

                // Scrape roster
                const players = await scrapeTeamRoster(`https://www.espn.com${team.rosterUrl}`);
                console.log(`Found ${players.length} skill position players for ${team.name}`);

                // Add delay to avoid rate limiting
                await delay(1500);

                // Scrape depth chart
                const depthChart = await scrapeTeamDepthChart(`https://www.espn.com${team.depthChartUrl}`);
                console.log(`Found depth chart data for ${depthChart.size} players`);

                // Upsert each player with depth rank
                for (const player of players) {
                    try {
                        const depthRank = depthChart.get(player.name) || null;
                        await upsertPlayer(supabase, player, teamId, depthRank);
                    } catch (error) {
                        console.error(`Failed to upsert player ${player.name}: ${error.message}`);
                    }
                }

                totalPlayersProcessed += players.length;
            } catch (error) {
                console.error(`Failed to process team ${team.name}: ${error.message}`);
                failedTeams.push(team.name);
            }
        }

        console.log('\n=== Scrape Complete ===');
        console.log(`Teams processed: ${teams.length - failedTeams.length}/${teams.length}`);
        console.log(`Total players processed: ${totalPlayersProcessed}`);
        if (failedTeams.length > 0) {
            console.log(`Failed teams: ${failedTeams.join(', ')}`);
        }

    } catch (error) {
        console.error('Scrape failed:', error);
        process.exit(1);
    }
}

main();
