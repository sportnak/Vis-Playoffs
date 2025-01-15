import { useAppSelector, useLeagues, useUser } from '@/app/hooks';
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
    useDialog,
    createListCollection,
    Icon,
    Spinner
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
import { Member, Team } from '@/app/types';
import { SelectContent, SelectItem, SelectLabel, SelectRoot, SelectTrigger, SelectValueText } from './ui/select';
import { LuPencil } from 'react-icons/lu';
import { InputGroup } from './ui/input-group';
import { MdOutlineSearch } from 'react-icons/md';
import { Tooltip } from './ui/tooltip';

const positions = createListCollection({
    items: [
        { value: '', label: 'ALL' },
        { value: 'QB', label: 'QB' },
        { value: 'RB', label: 'RB' },
        { value: 'WR', label: 'WR' },
        { value: 'TE', label: 'TE' },
        { value: 'FLEX', label: 'FLEX' },
        { value: 'SF', label: 'SF' }
    ]
});

export default function Draft({ pool, team, teams, member, draftPlayer, refreshDraft }) {
    const { round_id } = useAppSelector((state) => state.app);
    const [query, setQuery] = useState({
        drafted: true,
        pos: '',
        round_id: round_id.toString(),
        name: '',
        team_ids: []
    });
    const handleChangeDrafted = useCallback(() => {
        setQuery((x) => ({ ...x, drafted: !x.drafted }));
    }, []);

    const handleNameChange = useCallback((e) => {
        setQuery((x) => ({ ...x, name: e.target.value }));
    }, []);

    const handlePosChange = useCallback((e) => {
        setQuery((x) => ({
            ...x,
            pos: e.value[0]
        }));
    }, []);

    const { nflPlayers, load } = useNFLPlayers(query, pool?.id, pool?.league_id);
    useEffect(() => {
        setQuery((x) => ({ ...x, round_id: round_id.toString() }));
    }, [round_id]);

    const [playerConfirmation, setPlayerConfirmation] = useState<any>();

    const [currTurn, setCurrTurn] = useState<Team>(null);
    useEffect(() => {
        if (!pool || !teams) {
            return;
        }
        setCurrTurn(teams.find((x) => x.id === pool.current));
    }, [pool, teams]);
    const handleDraftPlayer = useCallback(
        async (player_id: number, team_id: number) => {
            const response = await draftPlayer(player_id, team_id);
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
        [draftPlayer, nflPlayers, refreshDraft, load]
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
                            <Button onClick={() => handleDraftPlayer(playerConfirmation?.id, pool?.current)}>
                                Save
                            </Button>
                        </DialogActionTrigger>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRootProvider>
            <Flex direction={'column'}>
                <Flex
                    flexDir={'row'}
                    base={{ flexDir: 'column', alignItems: 'flex-start' }}
                    sm={{ flexDir: 'column', alignItems: 'flex-start' }}
                    alignItems={'center'}
                    mb={5}
                    maxW="100%"
                    justifyContent="space-between"
                >
                    <Heading as="h2" fontWeight={100}>
                        Players
                    </Heading>
                    <HStack flexWrap={'wrap'}>
                        <SelectRoot
                            style={{ borderColor: 'gray', width: '150px', cursor: 'pointer' }}
                            collection={positions}
                            value={[query.pos]}
                            onValueChange={handlePosChange}
                            variant="subtle"
                        >
                            <SelectTrigger style={{ borderColor: 'gray' }}>
                                <SelectValueText placeholder="POS..." />
                            </SelectTrigger>
                            <SelectContent>
                                {positions?.items.map((team: any) => (
                                    <SelectItem cursor="pointer" item={team} key={team.value}>
                                        {team.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                        <Checkbox
                            variant="subtle"
                            cursor="pointer"
                            mr="10px"
                            checked={query.drafted}
                            onChange={handleChangeDrafted}
                        >
                            Drafted
                        </Checkbox>
                        <InputGroup
                            endElement={
                                <Icon fontSize="20px">
                                    <MdOutlineSearch />
                                </Icon>
                            }
                        >
                            <Input
                                w="300px"
                                variant="subtle"
                                placeholder="Search..."
                                value={query.name}
                                onChange={handleNameChange}
                                style={{ background: 'rgba(169, 169, 169, 0.1)', fontSize: '14px' }}
                            />
                        </InputGroup>
                    </HStack>
                </Flex>
                {pool && currTurn && (
                    <Center w="100%" p={4} boxShadow="sm" border="none" borderRadius="6px" bg="#e7f9e7" mb={5}>
                        <Heading size={'md'} as="h5" fontWeight={300}>
                            {pool.status === 'complete'
                                ? 'Drafting complete!'
                                : pool.current === team?.id
                                  ? "It's your turn to pick!"
                                  : `Waiting on ${currTurn?.name}`}
                        </Heading>
                    </Center>
                )}

                {!nflPlayers ? (
                    <Center>
                        <Spinner size="lg" />
                    </Center>
                ) : !nflPlayers.length ? (
                    <Center>
                        <Heading size={'md'} as="h5" fontWeight={300}>
                            No players. Games have not been set
                        </Heading>
                    </Center>
                ) : (
                    <Box width="100%" maxH="100vh" overflow={'scroll'}>
                        <Table.Root
                            background={'none'}
                            style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2 }}
                        >
                            <Table.Header>
                                <Table.Row background={'none'}>
                                    <Table.ColumnHeader>Pick No.</Table.ColumnHeader>
                                    <Table.ColumnHeader>Team</Table.ColumnHeader>
                                    <Table.ColumnHeader>Name</Table.ColumnHeader>
                                    <Table.ColumnHeader>Team</Table.ColumnHeader>
                                    <Table.ColumnHeader>Pos</Table.ColumnHeader>
                                    <Table.ColumnHeader></Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {nflPlayers?.map((player) => {
                                    return (
                                        <Table.Row background={'none'} key={player.id}>
                                            <Table.Cell>{player.team_players?.[0]?.pick_number}</Table.Cell>
                                            <Table.Cell>{player.team_players?.[0]?.team.name}</Table.Cell>
                                            <Table.Cell>{player.name}</Table.Cell>
                                            <Table.Cell>{player.nfl_team.name}</Table.Cell>
                                            <Table.Cell>{mapPos(player)}</Table.Cell>
                                            <Table.Cell>
                                                {player.team_players.filter((x) => x.pool_id === pool?.id)?.length !==
                                                0 ? (
                                                    'Drafted'
                                                ) : (
                                                    <Button
                                                        disabled={false}
                                                        as="div"
                                                        variant="ghost"
                                                        style={{
                                                            background: '#3D4946',
                                                            padding: '10px',
                                                            borderRadius: '8px',
                                                            height: '30px',
                                                            width: '75px',
                                                            color: 'white'
                                                        }}
                                                        _hover={{
                                                            background: '#2482A6'
                                                        }}
                                                        onClick={() => {
                                                            if (false) {
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
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                )}
            </Flex>
        </Box>
    );
}
