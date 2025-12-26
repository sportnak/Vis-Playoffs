'use client';
import { Field } from '@/components/ui/field';
import { NFLRound, RoundSettings as IRoundSettings } from '@/app/types';
import { GoGear } from 'react-icons/go';
import { useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { assignPools, upsertSettings } from '@/actions/league';
import { mapRound } from '@/utils';
import { useRounds } from '@/app/leagues/[league_id]/manage/hooks';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from './ui/dialog';
import { toast } from './ui/toaster';
import { useLeagueStore } from '@/stores/league-store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

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

export default function Rounds({ leagueId, rounds }: { leagueId: string; rounds: NFLRound[] }) {
    const league = useLeagueStore((state) => state.currentLeague);
    const { refresh: refreshRounds } = useRounds(leagueId);
    const members = league?.league_members;
    const [selectedRound, setSelectedRound] = useState<NFLRound | null>(null);
    const isMobile = useIsMobile();
    const handleSelectRound = useCallback((round: NFLRound) => {
        setSelectedRound(round);
    }, []);

    const handlePoolGeneration = useCallback(async () => {
        refreshRounds();
    }, []);

    if (selectedRound) {
        return <RoundSettings leagueId={leagueId} round={selectedRound} onClose={() => setSelectedRound(null)} />;
    }

    return (
        <>
            <h2 className={`font-light mb-5 ml-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>Rounds</h2>
            <div className={`bg-gray-800 rounded-lg shadow-md border border-gray-700 ${isMobile ? 'p-2' : 'p-4'}`}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className={`text-blue-400 ${isMobile ? 'text-xs p-2' : ''}`}>Round</TableHead>
                            <TableHead className={`text-blue-400 ${isMobile ? 'text-xs p-2' : ''}`}>Year</TableHead>
                            <TableHead className={`text-blue-400 ${isMobile ? 'text-xs p-2' : ''}`}>Status</TableHead>
                            <TableHead></TableHead>
                            <TableHead className={`text-blue-400 ${isMobile ? 'text-xs p-2' : ''}`}></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rounds?.map((round, index) => (
                            <TableRow key={index}>
                                <TableCell className={isMobile ? 'text-xs p-2' : ''}>{mapRound(round.round)}</TableCell>
                                <TableCell className={isMobile ? 'text-xs p-2' : ''}>{round.year}</TableCell>
                                <TableCell className={isMobile ? 'text-xs p-2' : ''}>{round.status}</TableCell>
                                <TableCell className={isMobile ? 'p-1' : ''}>
                                    {!round.pools?.length && (
                                        <ConfirmPoolGeneration
                                            members={members}
                                            leagueId={leagueId}
                                            roundId={round.id}
                                            onClose={handlePoolGeneration}
                                        >
                                            <Button
                                                aria-label="Assign Pools"
                                                className={`font-roboto-mono ${isMobile ? 'text-xs px-2 py-1 h-6' : ''}`}
                                                variant="outline"
                                                size={isMobile ? 'sm' : 'default'}
                                                onClick={() => {
                                                    console.log(round);
                                                }}
                                            >
                                                {isMobile ? 'ASSIGN' : 'ASSIGN POOLS'}
                                            </Button>
                                        </ConfirmPoolGeneration>
                                    )}
                                </TableCell>
                                <TableCell className={isMobile ? 'w-8 p-1' : 'w-10'}>
                                    <Button
                                        aria-label="Settings"
                                        variant="ghost"
                                        size="sm"
                                        className={isMobile ? 'h-6 w-6 p-0' : ''}
                                        onClick={() => handleSelectRound(round)}
                                    >
                                        <GoGear className={isMobile ? 'text-base' : 'text-xl'} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}

function RoundSettings({ round, onClose, leagueId }: { leagueId: string; round: NFLRound; onClose: () => void }) {
    const {
        handleSubmit,
        control,
        setError,
        formState: { errors }
    } = useForm<IRoundSettings>({
        defaultValues: round.round_settings[0]
    });
    const { refresh: refreshRounds } = useRounds(leagueId);
    const isMobile = useIsMobile();

    const onSubmit = async (data: IRoundSettings) => {
        await upsertSettings({
            id: round.round_settings[0]?.id,
            round_id: round.id,
            league_id: leagueId,
            ...data
        });
        toast.success('Settings Saved');
        refreshRounds();
    };

    return (
        <div className={isMobile ? 'mt-4' : 'mt-10'}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <fieldset>
                    <legend className={`text-center w-full border-b-2 border-gray-600 ${isMobile ? 'text-base mb-3 pb-2' : 'text-2xl mb-5 pb-2'}`}>
                        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between'} w-full items-center`}>
                            <h2 className={isMobile ? 'text-base' : 'text-2xl'}>
                                Round Settings ({mapRound(round.round)} {round.year})
                            </h2>
                            <div className={`flex ${isMobile ? 'gap-2 w-full' : 'gap-4'}`}>
                                <Button onClick={onClose} variant="outline" size={isMobile ? 'sm' : 'default'} className={isMobile ? 'flex-1 text-xs' : ''}>
                                    Back
                                </Button>
                                <Button type="submit" size={isMobile ? 'sm' : 'default'} className={isMobile ? 'flex-1 text-xs' : ''}>Save Settings</Button>
                            </div>
                        </div>
                    </legend>

                    <div>
                        <h3 className={`mb-4 ${isMobile ? 'text-base' : 'text-xl'}`}>Players Count</h3>
                        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                            <Field
                                id="rb_count"
                                errorText={errors['rb_count']?.message}
                                label="Running Backs Count"
                            >
                                <Input placeholder="1" type="number" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('rb_count')} />
                            </Field>
                            <Field
                                id="flex_count"
                                errorText={errors['flex_count']?.message}
                                label="Flex Count"
                            >
                                <Input placeholder="1" type="number" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('flex_count')} />
                            </Field>
                            <Field
                                id="qb_count"
                                errorText={errors['qb_count']?.message}
                                label="Quarterbacks Count"
                            >
                                <Input placeholder="1" type="number" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('qb_count')} />
                            </Field>
                            <Field
                                id="wr_count"
                                errorText={errors['wr_count']?.message}
                                label="Wide Receivers Count"
                            >
                                <Input placeholder="1" type="number" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('wr_count')} />
                            </Field>
                            <Field
                                id="te_count"
                                errorText={errors['te_count']?.message}
                                label="Tight Ends Count"
                            >
                                <Input placeholder="1" type="number" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('te_count')} />
                            </Field>
                            <Field
                                id="sf_count"
                                errorText={errors['sf_count']?.message}
                                label="Superflex Count"
                            >
                                <Input placeholder="1" type="number" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('sf_count')} />
                            </Field>
                        </div>
                        <h3 className={`mb-4 ${isMobile ? 'text-base mt-6' : 'text-xl mt-10'}`}>Scoring</h3>
                        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                            <Field id="rb_ppr" errorText={errors['rb_ppr']?.message} label="RB PPR">
                                <Input placeholder="1" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('rb_ppr')} />
                            </Field>
                            <Field id="wr_ppr" errorText={errors['wr_ppr']?.message} label="WR PPR">
                                <Input placeholder="1" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('wr_ppr')} />
                            </Field>
                            <Field id="te_ppr" errorText={errors['te_ppr']?.message} label="TE PPR">
                                <Input placeholder="1" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('te_ppr')} />
                            </Field>
                            <Field id="pass_td" errorText={errors['pass_td']?.message} label="Passing TD">
                                <Input placeholder="1" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('pass_td')} />
                            </Field>
                            <Field id="rush_td" errorText={errors['rush_td']?.message} label="Rushing TD">
                                <Input placeholder="1" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('rush_td')} />
                            </Field>
                            <Field id="rec_td" errorText={errors['rec_td']?.message} label="Receiving TD">
                                <Input placeholder="1" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('rec_td')} />
                            </Field>
                            <Field id="rush_yd" errorText={errors['rush_yd']?.message} label="Rushing Yards">
                                <Input placeholder="1" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('rush_yd')} />
                            </Field>
                            <Field id="rec_yd" errorText={errors['rec_yd']?.message} label="Receiving Yards">
                                <Input placeholder="1" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('rec_yd')} />
                            </Field>
                            <Field id="pass_yd" errorText={errors['pass_yd']?.message} label="Passing Yards">
                                <Input placeholder=".04" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('pass_yd')} />
                            </Field>
                            <Field id="fum" errorText={errors['fum']?.message} label="Fumble">
                                <Input placeholder="-2" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('fum')} />
                            </Field>
                            <Field id="int" errorText={errors['int']?.message} label="Int">
                                <Input placeholder="-2" className={isMobile ? 'h-8 text-xs' : ''} {...control.register('int')} />
                            </Field>
                        </div>
                    </div>
                </fieldset>
            </form>
        </div>
    );
}

function ConfirmPoolGeneration({ children, leagueId, roundId, onClose, members }) {
    const [count, setCount] = useState(1);
    const [open, setOpen] = useState(false);

    const handleGeneratePools = useCallback(async () => {
        await assignPools({ members, pool_count: count, league_id: leagueId, round_id: roundId });
        setOpen(false);
        onClose();
    }, [count, leagueId, roundId, members, onClose]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pool Generation</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Field label="Number of Pools">
                        <Input
                            type="number"
                            placeholder="1"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value))}
                        />
                    </Field>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleGeneratePools}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
