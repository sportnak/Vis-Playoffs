'use client';
import { useNFLPlayers } from '@/app/leagues/[league_id]/draft/hooks';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from './ui/toaster';
import { Checkbox } from './ui/checkbox';
import { mapPos } from '@/app/util';
import { Team } from '@/app/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MdOutlineSearch } from 'react-icons/md';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { H2, P } from './ui/text';
import { useUIStore } from '@/stores/ui-store';
import { CheckCircle } from 'lucide-react';
import { useLeagueStore } from '@/stores/league-store';

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    return isMobile;
};

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
    const round_id = useUIStore((state) => state.round_id);
    const isMobile = useIsMobile();
    const league = useLeagueStore()

    const teamMap = useMemo(() => teams.reduce((acc, curr) => ({
        ...acc,
        [curr.id]: curr.name
    }), {}), [teams])
    const [query, setQuery] = useState({
        drafted: undefined,
        pos: '',
        round_id: round_id?.toString() || '',
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
        if (round_id) {
            setQuery((x) => ({ ...x, round_id: round_id.toString() }));
        }
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
                toast.error(response.error.message);
                return;
            }
            toast.success(`Successfully drafted ${nflPlayers.find((x) => x.id === player_id)?.name}`);
            refreshDraft();
            load();
        },
        [draftPlayer, nflPlayers, refreshDraft, load]
    );

    const [dialogOpen, setDialogOpen] = useState(false);
    return (
        <div className="relative">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="p-0">
                    <DialogHeader className="px-4 py-4 border-b border-ui-border">
                        <DialogTitle className="tracking-mono text-sm">DRAFT: {playerConfirmation?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="px-4 pb-4 space-y-3 border-b border-ui-border">
                        <div className="flex justify-between items-center">
                            <span className="text-cool-gray tracking-mono text-xs">POSITION:</span>
                            <span className="text-frost font-medium">{playerConfirmation?.position}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-cool-gray tracking-mono text-xs">NFL TEAM:</span>
                            <span className="text-frost font-medium">{playerConfirmation?.nfl_team?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-cool-gray tracking-mono text-xs">DRAFTING TEAM:</span>
                            <span className="text-frost font-medium">{currTurn?.name}</span>
                        </div>
                    </div>
                    <DialogFooter className="pb-4 px-4">
                        <DialogClose asChild>
                            <Button variant="outline" className="font-roboto-mono tracking-button" size="sm">CANCEL</Button>
                        </DialogClose>
                        <Button variant="default" className="font-roboto-mono tracking-button" size="sm" onClick={() => {
                            handleDraftPlayer(playerConfirmation?.id, pool?.current);
                            setDialogOpen(false);
                        }}>
                            CONFIRM
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="flex flex-col">
                <P className={`py-2 px-4 border-b border-ui-border font-light font-roboto-mono tracking-[0.025rem] ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    PLAYERS
                </P>
                <div className={`p-2 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-5 max-w-full gap-2 md:gap-4`}>

                    <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full">
                        <Select value={query.pos} onValueChange={handlePosChange}>
                            <SelectTrigger className={isMobile ? 'w-[100px] h-8 text-xs' : 'w-[150px]'}>
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
                        <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={query.drafted}
                                onCheckedChange={handleChangeDrafted}
                            />
                            <span className={`text-frost ${isMobile ? 'text-xs' : 'text-sm'}`}>Drafted</span>
                        </label>
                        <div className={`relative flex-1 ${isMobile ? 'min-w-[140px]' : 'w-[300px]'}`}>
                            <Input
                                placeholder="Search..."
                                value={query.name}
                                onChange={handleNameChange}
                                className={`pr-10 ${isMobile ? 'h-8 text-xs' : ''}`}
                            />
                            <MdOutlineSearch className={`absolute right-3 top-1/2 -translate-y-1/2 text-cool-gray pointer-events-none ${isMobile ? 'text-lg' : 'text-xl'}`} />
                        </div>
                    </div>
                </div>
                {pool && currTurn && (
                    <div className={`w-full shadow-sm rounded-md bg-graphite mb-3 md:mb-5 flex justify-center items-center gap-2 flex-col ${isMobile ? 'p-2' : 'p-4'}`}>
                        <P className={`font-light text-center ${isMobile ? 'text-xs' : ''}`}>
                            {pool.status === 'complete'
                                ? 'Drafting complete!'
                                : pool.current === team?.id
                                    ? "It's your turn to pick!"
                                    : `Waiting on ${currTurn?.name}`}
                        </P>
                        <P className="text-xs">Draft Order:{pool.draft_order.map(id => teamMap[id]).join(', ')}</P>
                    </div>
                )}

                {!nflPlayers ? (
                    <div className="p-4 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan"></div>
                    </div>
                ) : !nflPlayers.length ? (
                    <div className="p-4 flex justify-center">
                        <P className="font-light">
                            No players drafted yet.
                        </P>
                    </div>
                ) : (
                    <div className={`w-full max-h-screen overflow-auto rounded-xl ${isMobile ? 'p-2' : 'p-4'}`}>
                        <Table className="bg-transparent">
                            <TableHeader className="sticky top-0 bg-steel z-[2]">
                                <TableRow className="bg-transparent border-b border-ui-border">
                                    {!isMobile && <TableHead className="text-xs">Pick No.</TableHead>}
                                    {!isMobile && <TableHead className="text-xs">Team</TableHead>}
                                    <TableHead className={isMobile ? 'w-8 p-0' : ''}></TableHead>
                                    <TableHead className={isMobile ? 'text-xs' : ''}>Name</TableHead>
                                    <TableHead className={isMobile ? 'text-xs' : ''}>Team</TableHead>
                                    <TableHead className={isMobile ? 'text-xs' : ''}>Pos</TableHead>
                                    <TableHead className={isMobile ? 'w-8 p-0' : ''}></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {nflPlayers?.map((player) => {
                                    return (
                                        <TableRow className="bg-transparent" key={player.id}>
                                            {!isMobile && (player.team_players?.[0]?.pick_number != null ? (
                                                <>
                                                    <TableCell className="text-xs">{player.team_players?.[0]?.pick_number}</TableCell>
                                                    <TableCell className="text-xs">{player.team_players?.[0]?.team.name}</TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell className="tracking-[0.025rem] font-roboto-mono text-xs text-ui-grid">UNDRAFTED</TableCell>
                                                    <TableCell />
                                                </>
                                            ))}
                                            <TableCell className={isMobile ? 'p-1' : ''}>
                                                <img src={player.headshot_url} className={isMobile ? 'w-8' : 'w-8'} />
                                            </TableCell>
                                            <TableCell className={isMobile ? 'text-xs p-2' : ''}>{player.name}</TableCell>
                                            <TableCell className={isMobile ? 'text-xs p-2' : ''}>{player.nfl_team.name}</TableCell>
                                            <TableCell className={isMobile ? 'text-xs p-2' : ''}>{player.position}</TableCell>
                                            <TableCell className={isMobile ? 'p-1' : ''}>
                                                {player.team_players.filter((x) => x.pool_id === pool?.id)?.length !==
                                                    0 ? (
                                                    <span className={`text-cool-gray ${isMobile ? 'text-xs' : ''}`}>Drafted</span>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`font-roboto-mono tracking-button text-white hover:bg-neo-green rounded-full ${isMobile ? 'h-6 w-6 p-0' : 'h-8 w-8'}`}
                                                        onClick={() => {
                                                            setPlayerConfirmation(player);
                                                            setDialogOpen(true);
                                                        }}
                                                    >
                                                        <CheckCircle height={isMobile ? '16px' : '24px'} width={isMobile ? '16px' : '24px'} />
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
