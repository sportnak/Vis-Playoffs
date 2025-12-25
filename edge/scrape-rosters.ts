import puppeteer from 'npm:puppeteer';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface TeamData {
    abbr: string;
    name: string;
    city: string;
    rosterUrl: string;
}

interface PlayerData {
    name: string;
    position: string;
}

async function scrapeTeamsPage(url: string): Promise<TeamData[]> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const teams: TeamData[] = [];

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const teamsData = await page.evaluate(() => {
            const teams: TeamData[] = [];

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

                teams.push({
                    abbr: abbr,
                    name: teamName,
                    city: city,
                    rosterUrl: href
                });
            });

            return teams;
        });

        teams.push(...teamsData);
    } finally {
        await browser.close();
    }

    // Deduplicate teams by abbreviation (in case there are duplicate links)
    const uniqueTeams = Array.from(
        new Map(teams.map(team => [team.abbr, team])).values()
    );

    return uniqueTeams;
}

async function scrapeTeamRoster(url: string): Promise<PlayerData[]> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const players: PlayerData[] = [];

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const playersData = await page.evaluate(() => {
            const players: PlayerData[] = [];
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
                        // Try to get name from link first
                        const nameLink = cells[nameIndex].querySelector('a');
                        name = nameLink?.textContent?.trim() || cells[nameIndex].textContent?.trim() || '';
                    } else {
                        // Fallback: find first cell with a link (usually the name)
                        const nameCell = row.querySelector('td a');
                        name = nameCell?.textContent?.trim() || '';
                    }

                    if (name) {
                        players.push({
                            name: name,
                            position: position
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

function mapPosition(espnPosition: string) {
    const pos = espnPosition.trim().toUpperCase();
    return {
        is_qb: pos === 'QB',
        is_rb: pos === 'RB' || pos === 'FB',
        is_wr: pos === 'WR',
        is_te: pos === 'TE'
    };
}

async function upsertTeam(supabase: any, team: TeamData): Promise<string> {
    const existing = await supabase
        .from('nfl_team')
        .select('id')
        .eq('abbr', team.abbr)
        .maybeSingle();

    if (existing.data) {
        await supabase
            .from('nfl_team')
            .update({ name: team.name, city: team.city })
            .eq('id', existing.data.id);
        return existing.data.id;
    } else {
        const { data } = await supabase
            .from('nfl_team')
            .insert({
                abbr: team.abbr,
                name: team.name,
                city: team.city
            })
            .select('id')
            .single();
        return data.id;
    }
}

async function upsertPlayer(supabase: any, player: PlayerData, teamId: string): Promise<void> {
    const existing = await supabase
        .from('player')
        .select('id')
        .eq('name', player.name)
        .eq('nfl_team_id', teamId)
        .maybeSingle();

    const playerData = {
        name: player.name,
        nfl_team_id: teamId,
        year: 2025,
        ...mapPosition(player.position)
    };

    if (existing.data) {
        await supabase
            .from('player')
            .update(playerData)
            .eq('id', existing.data.id);
    } else {
        await supabase
            .from('player')
            .insert(playerData);
    }
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

    const failedTeams: string[] = [];
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

                // Upsert team
                const teamId = await upsertTeam(supabaseClient, team);

                // Add delay to avoid rate limiting
                await delay(1500);

                // Scrape roster
                const players = await scrapeTeamRoster(`https://www.espn.com${team.rosterUrl}`);
                console.log(`Found ${players.length} skill position players for ${team.name}`);

                // Upsert each player
                for (const player of players) {
                    try {
                        await upsertPlayer(supabaseClient, player, teamId);
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

        return new Response(JSON.stringify({
            success: true,
            teamsProcessed: teams.length - failedTeams.length,
            totalTeams: teams.length,
            playersProcessed: totalPlayersProcessed,
            failedTeams: failedTeams
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Scrape failed:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            failedTeams: failedTeams
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
