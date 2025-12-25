import { useAppSelector, useLeagues, useUser } from '@/app/hooks';
import { useNFLPlayers, } from '@/app/leagues/[league_id]/draft/hooks';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toaster } from './ui/toaster';
import { useTeams } from '@/app/leagues/[league_id]/manage/hooks';
import { Checkbox } from './ui/checkbox';
import { mapPos } from '@/app/util';
import { Member, Team } from '@/app/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LuPencil } from 'react-icons/lu';
import { MdOutlineSearch } from 'react-icons/md';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from './ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { H2, P } from './ui/text';

const positions = [
    { value: 'ALL', label: 'ALL' },
    { value: 'QB', label: 'QB' },
    { value: 'RB', label: 'RB' },
    { value: 'WR', label: 'WR' },
    { value: 'TE', label: 'TE' },
    { value: 'FLEX', label: 'FLEX' },
    { value: 'SF', label: 'SF' }
];

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

    const handlePosChange = useCallback((value: string) => {
        setQuery((x) => ({
            ...x,
            pos: value
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
    const [dialogOpen, setDialogOpen] = useState(false);
    return (
        <div className="relative">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to draft {playerConfirmation?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-frost">Confirming this action will officially draft this player</p>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={() => {
                            handleDraftPlayer(playerConfirmation?.id, pool?.current);
                            setDialogOpen(false);
                        }}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 max-w-full gap-4">
                    <H2 className="font-light">
                        Players
                    </H2>
                    <div className="flex flex-wrap gap-3 items-center">
                        <Select value={query.pos} onValueChange={handlePosChange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="POS..." />
                            </SelectTrigger>
                            <SelectContent>
                                {positions.map((pos) => (
                                    <SelectItem key={pos.value} value={pos.value}>
                                        {pos.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <label className="flex items-center gap-2 cursor-pointer mr-2">
                            <Checkbox
                                checked={query.drafted}
                                onCheckedChange={handleChangeDrafted}
                            />
                            <span className="text-frost text-sm">Drafted</span>
                        </label>
                        <div className="relative w-[300px]">
                            <Input
                                placeholder="Search..."
                                value={query.name}
                                onChange={handleNameChange}
                                className="pr-10"
                            />
                            <MdOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-cool-gray pointer-events-none" />
                        </div>
                    </div>
                </div>
                {pool && currTurn && (
                    <div className="w-full p-4 shadow-sm rounded-md bg-[#e7f9e7] mb-5 flex justify-center">
                        <P className="font-light text-center">
                            {pool.status === 'complete'
                                ? 'Drafting complete!'
                                : pool.current === team?.id
                                    ? "It's your turn to pick!"
                                    : `Waiting on ${currTurn?.name}`}
                        </P>
                    </div>
                )}

                {!nflPlayers ? (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan"></div>
                    </div>
                ) : !nflPlayers.length ? (
                    <div className="flex justify-center">
                        <P className="font-light">
                            No players drafted yet.
                        </P>
                    </div>
                ) : (
                    <div className="w-full max-h-screen overflow-auto rounded-xl">
                        <Table className="bg-transparent">
                            <TableHeader className="sticky top-0 bg-steel z-[2]">
                                <TableRow className="bg-transparent border-b border-ui-border">
                                    <TableHead>Pick No.</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead>Pos</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {nflPlayers?.map((player) => {
                                    return (
                                        <TableRow className="bg-transparent" key={player.id}>
                                            <TableCell>{player.team_players?.[0]?.pick_number}</TableCell>
                                            <TableCell>{player.team_players?.[0]?.team.name}</TableCell>
                                            <TableCell>{player.name}</TableCell>
                                            <TableCell>{player.nfl_team.name}</TableCell>
                                            <TableCell>{mapPos(player)}</TableCell>
                                            <TableCell>
                                                {player.team_players.filter((x) => x.pool_id === pool?.id)?.length !==
                                                    0 ? (
                                                    <span className="text-cool-gray">Drafted</span>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="bg-[#3D4946] hover:bg-[#2482A6] text-white h-[30px] w-[75px] rounded-lg"
                                                        onClick={() => {
                                                            setPlayerConfirmation(player);
                                                            setDialogOpen(true);
                                                        }}
                                                    >
                                                        Draft
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
