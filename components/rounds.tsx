import { Field } from '@/components/ui/field';
import { NFLRound, RoundSettings as IRoundSettings, Pool } from '@/app/types';
import { GoGear } from 'react-icons/go';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { assignPools, createPools, upsertSettings } from '@/actions/league';
import { mapRound } from '@/utils';
import { useMembers, usePools, useRounds, useTeams } from '@/app/leagues/[league_id]/manage/hooks';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from './ui/dialog';
import { toaster } from './ui/toaster';
import { useAppSelector } from '@/app/hooks';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export default function Rounds({ leagueId, rounds }: { leagueId: number; rounds: NFLRound[] }) {
    const league = useAppSelector((state) => state.app.league);
    const { refresh: refreshRounds } = useRounds(league?.id);
    const members = league?.league_members;
    const [selectedRound, setSelectedRound] = useState<NFLRound | null>(null);
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
            <h2 className="text-2xl font-light mb-5 ml-2">Rounds</h2>
            <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-blue-400">Round</TableHead>
                            <TableHead className="text-blue-400">Year</TableHead>
                            <TableHead className="text-blue-400">Status</TableHead>
                            <TableHead></TableHead>
                            <TableHead className="text-blue-400">Settings</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rounds?.map((round, index) => (
                            <TableRow key={index}>
                                <TableCell>{mapRound(round.round)}</TableCell>
                                <TableCell>{round.year}</TableCell>
                                <TableCell>{round.status}</TableCell>
                                <TableCell>
                                    {!round.pools?.length && (
                                        <ConfirmPoolGeneration
                                            members={members}
                                            leagueId={leagueId}
                                            roundId={round.id}
                                            onClose={handlePoolGeneration}
                                        >
                                            <Button
                                                aria-label="Settings"
                                                className="font-roboto-mono"
                                                variant="outline"
                                                onClick={() => {
                                                    console.log(round);
                                                }}
                                            >
                                                ASSIGN POOLS
                                            </Button>
                                        </ConfirmPoolGeneration>
                                    )}
                                </TableCell>
                                <TableCell className="w-10">
                                    <Button
                                        aria-label="Settings"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSelectRound(round)}
                                    >
                                        <GoGear className="text-xl" />
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

function RoundSettings({ round, onClose, leagueId }: { leagueId: number; round: NFLRound; onClose: () => void }) {
    const {
        handleSubmit,
        control,
        setError,
        formState: { errors }
    } = useForm<IRoundSettings>({
        defaultValues: round.round_settings[0]
    });
    const { refresh: refreshRounds } = useRounds(leagueId);

    const onSubmit = async (data: IRoundSettings) => {
        await upsertSettings({
            id: round.round_settings[0]?.id,
            round_id: round.id,
            league_id: leagueId,
            ...data
        });
        toaster.create({
            type: 'success',
            title: 'Settings Saved'
        });
        refreshRounds();
    };

    return (
        <div className="mt-10">
            <form onSubmit={handleSubmit(onSubmit)}>
                <fieldset>
                    <legend className="text-2xl text-center mb-5 w-full border-b-2 border-gray-600 pb-2">
                        <div className="flex justify-between w-full items-center">
                            <h2 className="text-2xl">
                                Round Settings ({mapRound(round.round)} {round.year})
                            </h2>
                            <div className="flex gap-4">
                                <Button onClick={onClose} variant="outline">
                                    Back
                                </Button>
                                <Button type="submit">Save Settings</Button>
                            </div>
                        </div>
                    </legend>

                    <div>
                        <h3 className="text-xl mb-4">Players Count</h3>
                        <div className="grid grid-cols-4 gap-4">
                            <Field
                                id="rb_count"
                                errorText={errors['rb_count']?.message}
                                label="Running Backs Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('rb_count')} />
                            </Field>
                            <Field
                                id="flex_count"
                                errorText={errors['flex_count']?.message}
                                label="Flex Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('flex_count')} />
                            </Field>
                            <Field
                                id="qb_count"
                                errorText={errors['qb_count']?.message}
                                label="Quarterbacks Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('qb_count')} />
                            </Field>
                            <Field
                                id="wr_count"
                                errorText={errors['wr_count']?.message}
                                label="Wide Receivers Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('wr_count')} />
                            </Field>
                            <Field
                                id="te_count"
                                errorText={errors['te_count']?.message}
                                label="Tight Ends Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('te_count')} />
                            </Field>
                            <Field
                                id="sf_count"
                                errorText={errors['sf_count']?.message}
                                label="Superflex Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('sf_count')} />
                            </Field>
                        </div>
                        <h3 className="text-xl mt-10 mb-4">Scoring</h3>
                        <div className="grid grid-cols-4 gap-4">
                            <Field id="rb_ppr" errorText={errors['rb_ppr']?.message} label="RB PPR">
                                <Input placeholder="1" {...control.register('rb_ppr')} />
                            </Field>
                            <Field id="wr_ppr" errorText={errors['wr_ppr']?.message} label="WR PPR">
                                <Input placeholder="1" {...control.register('wr_ppr')} />
                            </Field>
                            <Field id="te_ppr" errorText={errors['te_ppr']?.message} label="TE PPR">
                                <Input placeholder="1" {...control.register('te_ppr')} />
                            </Field>
                            <Field id="pass_td" errorText={errors['pass_td']?.message} label="Passing TD">
                                <Input placeholder="1" {...control.register('pass_td')} />
                            </Field>
                            <Field id="rush_td" errorText={errors['rush_td']?.message} label="Rushing TD">
                                <Input placeholder="1" {...control.register('rush_td')} />
                            </Field>
                            <Field id="rec_td" errorText={errors['rec_td']?.message} label="Receiving TD">
                                <Input placeholder="1" {...control.register('rec_td')} />
                            </Field>
                            <Field id="rush_yd" errorText={errors['rush_yd']?.message} label="Rushing Yards">
                                <Input placeholder="1" {...control.register('rush_yd')} />
                            </Field>
                            <Field id="rec_yd" errorText={errors['rec_yd']?.message} label="Receiving Yards">
                                <Input placeholder="1" {...control.register('rec_yd')} />
                            </Field>
                            <Field id="pass_yd" errorText={errors['pass_yd']?.message} label="Passing Yards">
                                <Input placeholder=".04" {...control.register('pass_yd')} />
                            </Field>
                            <Field id="fum" errorText={errors['fum']?.message} label="Fumble">
                                <Input placeholder="-2" {...control.register('fum')} />
                            </Field>
                            <Field id="int" errorText={errors['int']?.message} label="Int">
                                <Input placeholder="-2" {...control.register('int')} />
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
        const pools = await createPools(count, leagueId, roundId);
        await assignPools({ members, pools });
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
