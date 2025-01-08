import { useLeagues, useUser } from '@/app/hooks';
import { useDraft, useMember, useNFLPlayers, usePool } from '@/app/leagues/[league_id]/draft/hooks';
import {
    DialogRootProvider,
    Flex,
    Table,
    Button,
    Heading,
    HStack,
    Input,
    Center,
    Box,
    useDialog
} from '@chakra-ui/react';
import {
    DialogRoot,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogCloseTrigger
} from '@/components/ui/dialog';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toaster } from './ui/toaster';
import { useTeams } from '@/app/leagues/[league_id]/manage/hooks';
import { Checkbox } from './ui/checkbox';
import { mapPos } from '@/app/util';

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
    const { league_id, round: round_id } = useParams();
    const { user } = useUser();
    const { member, pool, draftPlayer, refreshDraft } = useDraft(
        parseInt(league_id as string),
        parseInt(round_id as string),
        user
    );

    const [query, setQuery] = useState({ drafted: false, round_id: round_id as string, name: '', team_ids: [] });
    const handleChangeDrafted = useCallback(() => {
        setQuery((x) => ({ ...x, drafted: !x.drafted }));
    }, []);

    const handleNameChange = useCallback((e) => {
        setQuery((x) => ({ ...x, name: e.target.value }));
    }, []);

    const { nflPlayers, load } = useNFLPlayers(query, pool?.id);

    const [playerConfirmation, setPlayerConfirmation] = useState<any>();

    const [isTurn, setIsTurn] = useState(false);
    useEffect(() => {
        if (!pool) return;
        const team = pool.team.find((x) => x.member_id === member?.id);
        if (pool.current === team?.id) {
            setIsTurn(true);
        }
    }, [pool, member]);

    const handleDraftPlayer = useCallback(
        async (player_id: number) => {
            const response = await draftPlayer(player_id);
            if (response.error) {
                toaster.create({
                    type: 'error',
                    title: response.error.message
                });
                return;
            }
            toaster.create({
                type: 'success',
                title: `Successfully drafted ${nflPlayers.find((x) => x.id === player_id)?.name}`
            });
            refreshDraft();
            load();
        },
        [draftPlayer, nflPlayers, load]
    );
    const dialog = useDialog();

    return (
        <Box position="relative">
            <DialogRootProvider value={dialog} placement={'center'}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to draft {playerConfirmation?.name}</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <p>Confirming this action will officially draft this player</p>
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogActionTrigger>
                        <DialogActionTrigger asChild>
                            <Button onClick={() => handleDraftPlayer(playerConfirmation?.id)}>Save</Button>
                        </DialogActionTrigger>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRootProvider>
            <Flex direction={'column'}>
                <HStack mb={5} w="100%" justifyContent="space-between">
                    <Heading as="h2">Players</Heading>
                    <HStack>
                        <Input value={query.name} onChange={handleNameChange} />
                        <Checkbox cursor="pointer" checked={query.drafted} onChange={handleChangeDrafted}>
                            Drafted
                        </Checkbox>
                    </HStack>
                </HStack>
                {pool && (
                    <Center w="100%" p={4}>
                        <Heading size={'md'} as="h5">
                            {isTurn ? "It's your turn to pick!" : `Waiting on ${pool?.current}`}
                        </Heading>
                    </Center>
                )}

                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>Name</Table.ColumnHeader>
                            <Table.ColumnHeader>Team</Table.ColumnHeader>
                            <Table.ColumnHeader>Pos</Table.ColumnHeader>
                            <Table.ColumnHeader></Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {nflPlayers?.map((player) => (
                            <Table.Row key={player.id}>
                                <Table.Cell>{player.name}</Table.Cell>
                                <Table.Cell>{player.nfl_team.name}</Table.Cell>
                                <Table.Cell>{mapPos(player)}</Table.Cell>
                                <Table.Cell>
                                    {player.team_players?.length !== 0 ? (
                                        'Drafted'
                                    ) : (
                                        <Button
                                            as="div"
                                            disabled={!isTurn}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'background-color 0.3s',
                                                padding: '10px',
                                                borderRadius: '8px'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'green')}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                                            onClick={() => {
                                                if (!isTurn) {
                                                    return;
                                                }

                                                setPlayerConfirmation(player);
                                                dialog.setOpen(true);
                                            }}
                                        >
                                            Draft
                                        </Button>
                                    )}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Flex>
        </Box>
    );
}
