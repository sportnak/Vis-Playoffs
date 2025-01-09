import { usePoints } from '@/app/leagues/[league_id]/hooks';
import { Team } from '@/app/types';
import { mapPos } from '@/app/util';
import { Box, Table, Button, Heading } from '@chakra-ui/react';
import { useParams } from 'next/navigation';

export function Scoreboard({ league_id, round_id }) {
    const { teams, refresh } = usePoints(parseInt(league_id as string), round_id);
    return (
        <Box>
            <Heading mb="20px">Scoreboard</Heading>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Name</Table.ColumnHeader>
                        <Table.ColumnHeader>Points</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {teams?.map((team) => (
                        <Table.Row key={team.id}>
                            <Table.Cell>{team.name}</Table.Cell>
                            <Table.Cell>{totalPoints(team)}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}

function totalPoints(team: Team) {
    return team.team_players.reduce((acc, player) => acc + player.score, 0);
}
