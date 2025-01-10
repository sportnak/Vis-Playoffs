import { Text, Box, Button, Fieldset, Heading, Icon, Input, Table, HStack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { NFLRound, RoundSettings as IRoundSettings, Pool } from '@/app/types';
import { GoGear } from 'react-icons/go';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { assignPools, createPools, upsertSettings } from '@/actions/league';
import { mapRound } from '@/utils';
import { useMembers, usePools, useTeams } from '@/app/leagues/[league_id]/manage/hooks';
import {
    DialogRoot,
    DialogActionTrigger,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from './ui/dialog';
import { toaster } from './ui/toaster';

export default function Rounds({ leagueId, rounds }: { leagueId: number; rounds: NFLRound[] }) {
    const [selectedRound, setSelectedRound] = useState<NFLRound | null>(null);
    const [selectedRoundPool, setSelectedRoundPool] = useState<NFLRound | null>(null);
    const handleSelectRound = useCallback((round: NFLRound) => {
        setSelectedRound(round);
    }, []);
    const handleSelectRoundPool = useCallback((round: NFLRound) => {
        setSelectedRoundPool(round);
    }, []);

    if (selectedRound) {
        return <RoundSettings leagueId={leagueId} round={selectedRound} onClose={() => setSelectedRound(null)} />;
    }

    if (selectedRoundPool) {
        return <Pools leagueId={leagueId} round={selectedRoundPool} onClose={() => setSelectedRoundPool(null)} />;
    }

    return (
        <Table.Root width="100%">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader>Round</Table.ColumnHeader>
                    <Table.ColumnHeader>Year</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Pools</Table.ColumnHeader>
                    <Table.ColumnHeader>Settings</Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {rounds?.map((round, index) => (
                    <Table.Row key={index}>
                        <Table.Cell>{mapRound(round.round)}</Table.Cell>
                        <Table.Cell>{round.year}</Table.Cell>
                        <Table.Cell>{round.status}</Table.Cell>
                        <Table.Cell>
                            <Button aria-label="Settings" variant="plain" onClick={() => handleSelectRoundPool(round)}>
                                <Icon fontSize="20px">
                                    <GoGear />
                                </Icon>
                            </Button>
                        </Table.Cell>
                        <Table.Cell w="40px">
                            <Button aria-label="Settings" variant="plain" onClick={() => handleSelectRound(round)}>
                                <Icon fontSize="20px">
                                    <GoGear />
                                </Icon>
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
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
    const onSubmit = async (data: IRoundSettings) => {
        const playerCountFields = ['rb_count', 'flex_count', 'qb_count', 'wr_count', 'te_count', 'sf_count'];
        const scoringFields = ['rb_ppr'];

        let has_errors = false;
        [...playerCountFields, ...scoringFields].forEach((field) => {
            const value = data[field];
            if (isNaN(parseInt(value))) {
                setError(field as any, {
                    type: 'manual',
                    message: 'Missing or invalid'
                });
                has_errors = true;
            }
        });

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
        // await inviteMember({ email: data.email, league_id });
    };

    return (
        <Box mt={10}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Fieldset.Root>
                    <Fieldset.Legend as="h2" textAlign="center" mb={5} w="100%" borderBottom="2px solid gray " pb={2}>
                        <Box display="flex" justifyContent="space-between" w="100%">
                            <Heading as="h2">
                                Round Settings ({mapRound(round.round)} {round.year})
                            </Heading>
                            <Box>
                                <Button onClick={onClose} variant="outline" mr={4}>
                                    Back
                                </Button>
                                <Button variant="solid" type="submit">
                                    Save Settings
                                </Button>
                            </Box>
                        </Box>
                    </Fieldset.Legend>

                    <Fieldset.Content>
                        <Heading as="h3">Players Count</Heading>
                        <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={4}>
                            <Field
                                id="rb_count"
                                errorText={<Text>{errors['rb_count']?.message}</Text>}
                                label="Running Backs Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('rb_count')} />
                            </Field>
                            <Field
                                id="flex_count"
                                errorText={<Text>{errors['flex_count']?.message}</Text>}
                                label="Flex Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('flex_count')} />
                            </Field>
                            <Field
                                id="qb_count"
                                errorText={<Text>{errors['qb_count']?.message}</Text>}
                                label="Quarterbacks Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('qb_count')} />
                            </Field>
                            <Field
                                id="wr_count"
                                errorText={<Text>{errors['wr_count']?.message}</Text>}
                                label="Wide Receivers Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('wr_count')} />
                            </Field>
                            <Field
                                id="te_count"
                                errorText={<Text>{errors['te_count']?.message}</Text>}
                                label="Tight Ends Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('te_count')} />
                            </Field>
                            <Field
                                id="sf_count"
                                errorText={<Text>{errors['sf_count']?.message}</Text>}
                                label="Superflex Count"
                            >
                                <Input placeholder="1" type="number" {...control.register('sf_count')} />
                            </Field>
                        </Box>
                        <Heading as="h3" mt={10}>
                            Scoring
                        </Heading>
                        <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={4}>
                            <Field id="rb_ppr" errorText={<Text>{errors['rb_ppr']?.message}</Text>} label="RB PPR">
                                <Input placeholder="1" {...control.register('rb_ppr')} />
                            </Field>
                            <Field id="wr_ppr" errorText={<Text>{errors['wr_ppr']?.message}</Text>} label="WR PPR">
                                <Input placeholder="1" {...control.register('wr_ppr')} />
                            </Field>
                            <Field id="te_ppr" errorText={<Text>{errors['te_ppr']?.message}</Text>} label="TE PPR">
                                <Input placeholder="1" {...control.register('te_ppr')} />
                            </Field>
                            <Field
                                id="pass_td"
                                errorText={<Text>{errors['pass_td']?.message}</Text>}
                                label="Passing TD"
                            >
                                <Input placeholder="1" {...control.register('pass_td')} />
                            </Field>
                            <Field
                                id="rush_td"
                                errorText={<Text>{errors['rush_td']?.message}</Text>}
                                label="Rushing TD"
                            >
                                <Input placeholder="1" {...control.register('rush_td')} />
                            </Field>
                            <Field
                                id="rec_td"
                                errorText={<Text>{errors['rec_td']?.message}</Text>}
                                label="Receiving TD"
                            >
                                <Input placeholder="1" {...control.register('rec_td')} />
                            </Field>
                            <Field
                                id="rush_yd"
                                errorText={<Text>{errors['rush_yd']?.message}</Text>}
                                label="Rushing Yards"
                            >
                                <Input placeholder="1" {...control.register('rush_yd')} />
                            </Field>
                            <Field
                                id="rec_yd"
                                errorText={<Text>{errors['rec_yd']?.message}</Text>}
                                label="Receiving Yards"
                            >
                                <Input placeholder="1" {...control.register('rec_yd')} />
                            </Field>
                            <Field
                                id="pass_yd"
                                errorText={<Text>{errors['pass_yd']?.message}</Text>}
                                label="Passing Yards"
                            >
                                <Input placeholder=".04" {...control.register('pass_yd')} />
                            </Field>
                            <Field id="fum" errorText={<Text>{errors['fum']?.message}</Text>} label="Fumble">
                                <Input placeholder="-2" {...control.register('fum')} />
                            </Field>
                            <Field id="int" errorText={<Text>{errors['int']?.message}</Text>} label="Int">
                                <Input placeholder="-2" {...control.register('int')} />
                            </Field>
                        </Box>
                    </Fieldset.Content>
                </Fieldset.Root>
            </form>
        </Box>
    );
}

function Pools({ round, onClose, leagueId }: { leagueId: number; round: NFLRound; onClose: () => void }) {
    const { pools, load: loadPools } = usePools(leagueId, round.id);
    const { members, load: loadMembers } = useMembers(leagueId);
    const pool_ids = useMemo(() => pools?.map((x) => x.id), [pools]);
    const { teams, load: loadTeams } = useTeams(pool_ids);

    const handleAssignPools = useCallback(async () => {
        await assignPools({ members, pools });
        loadTeams();

        toaster.create({
            title: 'Pools Assigned',
            type: 'success'
        });
        loadPools();
    }, [members, pools, loadPools]);

    const handlePoolGeneration = useCallback(async () => {
        loadPools();
    }, []);

    return (
        <Box>
            <HStack w="100%" justifyContent="space-between" mb={5}>
                <Heading as="h2">
                    Pools ({mapRound(round.round)} {round.year})
                </Heading>
                <HStack>
                    <Button variant="outline" onClick={onClose}>
                        Back
                    </Button>
                    {!pools?.length && (
                        <ConfirmPoolGeneration leagueId={leagueId} roundId={round.id} onClose={handlePoolGeneration}>
                            <Button as="div" variant="solid">
                                Generate Pools
                            </Button>
                        </ConfirmPoolGeneration>
                    )}
                    {!!pools?.length && !teams?.length && (
                        <Button as="div" variant="solid" onClick={handleAssignPools}>
                            Assign Pools ({pools?.length})
                        </Button>
                    )}
                </HStack>
            </HStack>

            <Table.Root width="100%">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Email</Table.ColumnHeader>
                        <Table.ColumnHeader>Team Assigned</Table.ColumnHeader>
                        <Table.ColumnHeader>Pick</Table.ColumnHeader>
                        <Table.ColumnHeader>Pool Name</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {members?.map((member, index) => {
                        const team = teams?.find((team) => team.member_id === member.id);
                        const pool = pools?.find((pool) => pool.id === team?.pool_id);
                        return (
                            <Table.Row key={index}>
                                <Table.Cell>{member.email}</Table.Cell>
                                <Table.Cell>{team != null ? 'Assigned' : 'Unassigned'}</Table.Cell>
                                <Table.Cell>
                                    {!pool ? '' : pool.draft_order.findIndex((x) => x === team.id) + 1}
                                </Table.Cell>
                                <Table.Cell>{pool?.name ?? ''}</Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}

function ConfirmPoolGeneration({ children, leagueId, roundId, onClose }) {
    const [count, setCount] = useState(1);

    const handleGeneratePools = useCallback(async () => {
        await createPools(count, leagueId, roundId);
        onClose();
    }, [count]);

    return (
        <DialogRoot size="md" placement="center">
            <DialogTrigger>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pool Generation</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <Field label="Number of Pools">
                        <Input
                            type="number"
                            placeholder="1"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value))}
                        />
                    </Field>
                </DialogBody>
                <DialogFooter>
                    <DialogActionTrigger>
                        <Button variant="outline">Cancel</Button>
                    </DialogActionTrigger>
                    <DialogActionTrigger>
                        <Button variant="solid" onClick={handleGeneratePools}>
                            Confirm
                        </Button>
                    </DialogActionTrigger>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    );
}
