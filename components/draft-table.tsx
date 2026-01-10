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
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLeagueStore } from '@/stores/league-store';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

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
    const league = useLeagueStore();
    const isHiddenUser = member?.user_id === '8c438cf9-ad89-4964-8cfe-cf897eb73ed3';

    const teamMap = useMemo(() => teams.reduce((acc, curr) => ({
        ...acc,
        [curr.id]: curr.name
    }), {}), [teams])
    const [query, setQuery] = useState({
        drafted: 'both' as 'both' | 'drafted' | 'undrafted',
        pos: '',
        round_id: round_id?.toString() || '',
        name: '',
        team_ids: [],
        page: 0
    });
    const handleChangeDrafted = useCallback((value: 'both' | 'drafted' | 'undrafted') => {
        setQuery((x) => ({ ...x, drafted: value, page: 0 }));
    }, []);

    const handleNameChange = useCallback((e) => {
        setQuery((x) => ({ ...x, name: e.target.value, page: 0 }));
    }, []);

    const handlePosChange = useCallback((value: string) => {
        setQuery((x) => ({
            ...x,
            pos: value,
            page: 0
        }));
    }, []);

    const handleNextPage = useCallback(() => {
        setQuery((x) => ({ ...x, page: x.page + 1 }));
    }, []);

    const handlePrevPage = useCallback(() => {
        setQuery((x) => ({ ...x, page: Math.max(0, x.page - 1) }));
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
                <div className="flex items-center justify-between py-2 px-4 border-b border-ui-border">
                    <P className={`font-light font-roboto-mono tracking-[0.025rem] ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        PLAYERS
                        {pool && currTurn && (
                            <span className="text-cool-gray">
                                {' '}(
                                {pool.status === 'complete'
                                    ? 'Draft Complete'
                                    : pool.current === team?.id
                                        ? "Your Turn"
                                        : `${currTurn?.name}'s Turn`}
                                )
                            </span>
                        )}
                    </P>
                </div>
                {nflPlayers && nflPlayers.length > 0 && !isHiddenUser && (
                    <div className={`flex items-center justify-between border-b border-ui-border ${isMobile ? 'px-2 py-2' : 'px-4 py-3'}`}>
                        {pool?.draft_order ? (
                            <P className={`text-xs text-cool-gray ${isMobile ? 'hidden' : ''}`}>
                                Order: {pool.draft_order.map((id: string) => teamMap[id]).join(', ')}
                            </P>
                        ) : (
                            <div />
                        )}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={query.page === 0}
                                className={`font-roboto-mono tracking-button ${isMobile ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}`}
                            >
                                <ChevronLeft className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
                            </Button>
                            <div className={`mt-0! font-light ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                Page {query.page + 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={nflPlayers.length < 20}
                                className={`font-roboto-mono tracking-button ${isMobile ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}`}
                            >
                                <ChevronRight className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
                            </Button>
                        </div>
                    </div>
                )}
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
                        {!isHiddenUser && (
                            <RadioGroup value={query.drafted} onValueChange={handleChangeDrafted} className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <RadioGroupItem value="both" id="both" />
                                    <Label htmlFor="both" className={`text-frost cursor-pointer ${isMobile ? 'text-xs' : 'text-sm'}`}>Both</Label>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <RadioGroupItem value="drafted" id="drafted" />
                                    <Label htmlFor="drafted" className={`text-frost cursor-pointer ${isMobile ? 'text-xs' : 'text-sm'}`}>Drafted</Label>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <RadioGroupItem value="undrafted" id="undrafted" />
                                    <Label htmlFor="undrafted" className={`text-frost cursor-pointer ${isMobile ? 'text-xs' : 'text-sm'}`}>Undrafted</Label>
                                </div>
                            </RadioGroup>
                        )}
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
                                                        variant="default"
                                                        size="sm"
                                                        className={`font-roboto-mono tracking-button}`}
                                                        onClick={() => {
                                                            setPlayerConfirmation(player);
                                                            setDialogOpen(true);
                                                        }}
                                                    >
                                                        DRAFT
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
