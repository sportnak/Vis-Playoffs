import { Text, Box, createListCollection, HStack, VStack } from '@chakra-ui/react';
import { SelectContent, SelectItem, SelectLabel, SelectRoot, SelectTrigger, SelectValueText } from './ui/select';
import { useEffect, useMemo, useState } from 'react';
import { NFLRound, Player, RoundSettings, Team, TeamPlayer } from '@/app/types';
import { toaster } from './ui/toaster';
import { mapPos } from '@/app/util';

export default function Teams({ teams, round, memberId }: { memberId: number; teams: Team[]; round: NFLRound }) {
    const teamSelect = useMemo(() => {
        if (!teams) {
            return;
        }

        return createListCollection({
            items: teams?.map((team) => {
                return {
                    value: team.id,
                    label: team.name
                };
            })
        });
    }, [teams]);
    const [value, setValue] = useState<any>();
    useEffect(() => {
        const teamId = teams?.find((team) => team.member_id === memberId)?.id;
        if (!teamId) {
            return;
        }
        setValue([teamId]);
    }, [memberId, teams]);

    const qbCount = useMemo(() => round?.round_settings[0]?.qb_count, [round]);
    const wrCount = useMemo(() => round?.round_settings[0]?.wr_count, [round]);
    const rbCount = useMemo(() => round?.round_settings[0]?.wr_count, [round]);
    const teCount = useMemo(() => round?.round_settings[0]?.te_count, [round]);
    const flexCount = useMemo(() => round?.round_settings[0]?.flex_count, [round]);
    const sfCount = useMemo(() => round?.round_settings[0]?.sf_count, [round]);

    const displayTeam = useMemo(() => {
        const team = teams?.find((team) => team.id === value?.[0]);
        return createTeam(team, {
            qbCount,
            wrCount,
            rbCount,
            teCount,
            flexCount,
            sfCount
        });
    }, [qbCount, wrCount, rbCount, teCount, flexCount, teams, sfCount, value]);

    if (!teams?.length) {
        return;
    }

    return (
        <Box p="20px" border="1px solid gray" borderRadius="6px" h="100%">
            <SelectRoot
                style={{ borderColor: 'gray', marginBottom: '20px', cursor: 'pointer' }}
                collection={teamSelect}
                value={value}
                onValueChange={(e) => setValue(e.value)}
                variant="subtle"
            >
                <SelectLabel>Teams</SelectLabel>
                <SelectTrigger style={{ borderColor: 'gray' }}>
                    <SelectValueText placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                    {teamSelect?.items.map((team: any) => (
                        <SelectItem cursor="pointer" item={team} key={team.value}>
                            {team.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </SelectRoot>
            <VStack w="100%">
                {Array.from({ length: qbCount }).map((_, index) => (
                    <PlayerItem key={index} player={displayTeam?.qbs?.[index]} position="QB" />
                ))}
                {Array.from({ length: rbCount }).map((_, index) => (
                    <PlayerItem key={index} player={displayTeam?.rbs?.[index]} position="RB" />
                ))}
                {Array.from({ length: wrCount }).map((_, index) => (
                    <PlayerItem key={index} player={displayTeam?.wrs?.[index]} position="WR" />
                ))}
                {Array.from({ length: teCount }).map((_, index) => (
                    <PlayerItem key={index} player={displayTeam?.tes?.[index]} position="TE" />
                ))}
                {Array.from({ length: flexCount }).map((_, index) => (
                    <PlayerItem key={index} player={displayTeam?.flexs?.[index]} position="FLEX" />
                ))}
                {Array.from({ length: sfCount }).map((_, index) => (
                    <PlayerItem key={index} player={displayTeam?.sfs?.[index]} position="SF" />
                ))}
            </VStack>
        </Box>
    );
}

function PlayerItem({ player, position }: { player?: Player; position: string }) {
    return (
        <HStack w="100%">
            <Box flex={1}>{position}</Box>
            {player ? (
                <Text flex={4} textAlign={'left'}>
                    {player.name}
                </Text>
            ) : (
                <Box flex={4} h={0.5} bg="gray" />
            )}
        </HStack>
    );
}

function createTeam(team: Team, counts) {
    const qbs = [];
    const rbs = [];
    const tes = [];
    const wrs = [];
    const flexs = [];
    const sfs = [];

    if (!team) {
        return {};
    }

    for (const player of team.team_players) {
        console.log(player.player.name);
        if (player.player.is_qb) {
            if (qbs.length < counts.qbCount) {
                qbs.push(player.player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player.player);
            } else {
                toaster.create({
                    type: 'error',
                    title: 'Invalid team found.'
                });
            }
        }

        if (player.player.is_rb) {
            if (rbs.length < counts.rbCount) {
                rbs.push(player.player);
            } else if (flexs.length < counts.flexCount) {
                flexs.push(player.player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player.player);
            } else {
                toaster.create({
                    type: 'error',
                    title: 'Invalid team found.'
                });
            }
        }

        if (player.player.is_wr) {
            if (wrs.length < counts.wrCount) {
                wrs.push(player.player);
            } else if (flexs.length < counts.flexCount) {
                flexs.push(player.player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player.player);
            } else {
                toaster.create({
                    type: 'error',
                    title: 'Invalid team found.'
                });
            }
        }

        if (player.player.is_te) {
            if (tes.length < counts.teCount) {
                tes.push(player.player);
            } else if (flexs.length < counts.flexCount) {
                flexs.push(player.player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player.player);
            } else {
                toaster.create({
                    type: 'error',
                    title: 'Invalid team found.'
                });
            }
        }
    }

    return {
        qbs,
        wrs,
        tes,
        rbs,
        flexs,
        sfs
    };
}
