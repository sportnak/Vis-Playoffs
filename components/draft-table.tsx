import { useLeagues } from '@/app/hooks';
import {
    DialogRoot,
    Flex,
    Table,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    Button,
    DialogCloseTrigger
} from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const players = [
    {
        id: 1,
        name: 'Justin Jefferson',
        team: 'Minesota Vikings'
    },
    {
        id: 2,
        name: 'Patrick Mahomes',
        team: 'Kansas City Chiefs'
    },
    {
        id: 3,
        name: 'Derrick Henry',
        team: 'Tennessee Titans'
    },
    {
        id: 4,
        name: 'Davante Adams',
        team: 'Las Vegas Raiders'
    },
    {
        id: 5,
        name: 'Aaron Rodgers',
        team: 'New York Jets'
    },
    {
        id: 6,
        name: 'Travis Kelce',
        team: 'Kansas City Chiefs'
    }
];

export default function Draft() {
    const { league_id } = useParams();
    const { leagues } = useLeagues();
    const [league, setLeague] = useState(null);

    useEffect(() => {
        if (leagues && league_id) {
            const foundLeague = leagues.find((l) => l.id === parseInt(league_id?.toString()));
            setLeague(foundLeague);
        }
    }, [leagues, league_id]);

    const [playerConfirmation, setPlayerConfirmation] = useState<string | undefined>();

    return (
        <DialogRoot size={'md'} placement={'center'}>
            <Flex direction={'column'}>
                <h1>Players</h1>
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>Name</Table.ColumnHeader>
                            <Table.ColumnHeader>Team</Table.ColumnHeader>
                            <Table.ColumnHeader>Stats</Table.ColumnHeader>
                            <Table.ColumnHeader></Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {players.map((player) => (
                            <Table.Row key={player.id}>
                                <Table.Cell>{player.name}</Table.Cell>
                                <Table.Cell>{player.team}</Table.Cell>
                                <Table.Cell>{'Link to career stats or something'}</Table.Cell>
                                <Table.Cell>
                                    <DialogTrigger asChild>
                                        <div
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'background-color 0.3s',
                                                padding: '10px',
                                                borderRadius: '8px'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'green')}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                                            onClick={() => setPlayerConfirmation(player.name)}
                                        >
                                            Draft
                                        </div>
                                    </DialogTrigger>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to draft {playerConfirmation}</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <p>Confirming this action will officially draft this player</p>
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogActionTrigger>
                        <Button>Save</Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </Flex>
        </DialogRoot>
    );
}
