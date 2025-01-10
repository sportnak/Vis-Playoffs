import { Text, Box, createListCollection, HStack, VStack, Button, Heading, Center } from '@chakra-ui/react';
import { SelectContent, SelectItem, SelectLabel, SelectRoot, SelectTrigger, SelectValueText } from './ui/select';
import { useEffect, useMemo, useState } from 'react';
import { NFLRound, Player, Pool, RoundSettings, Team, TeamPlayer } from '@/app/types';
import { toaster } from './ui/toaster';
import { mapPos } from '@/app/util';
import { Select } from './select';

export default function Teams({
    teams,
    round,
    memberId,
    dropPlayer,
    pool
}: {
    pool: Pool;
    memberId: number;
    teams: Team[];
    round: NFLRound;
    dropPlayer: (player_id: number) => void;
}) {
    const teamSelect = useMemo(() => {
        if (!teams) {
            return;
        }

        return teams?.map((team) => {
            return {
                value: team.id.toString(),
                label: team.name
            };
        });
    }, [teams]);
    const [value, setValue] = useState<any>();
    useEffect(() => {
        const team = teams?.find((team) => team.member_id === memberId);
        if (!team) {
            return;
        }
        setValue({ value: team.id, label: team.name });
    }, [memberId, teams]);

    const qbCount = useMemo(() => round?.round_settings[0]?.qb_count, [round]);
    const wrCount = useMemo(() => round?.round_settings[0]?.wr_count, [round]);
    const rbCount = useMemo(() => round?.round_settings[0]?.rb_count, [round]);
    const teCount = useMemo(() => round?.round_settings[0]?.te_count, [round]);
    const flexCount = useMemo(() => round?.round_settings[0]?.flex_count, [round]);
    const sfCount = useMemo(() => round?.round_settings[0]?.sf_count, [round]);
    const team = useMemo(() => teams?.find((team) => team.id === value?.value), [teams, value]);

    const displayTeam = useMemo(() => {
        return createTeam(team, {
            qbCount,
            wrCount,
            rbCount,
            teCount,
            flexCount,
            sfCount
        });
    }, [qbCount, wrCount, rbCount, teCount, flexCount, teams, sfCount, value]);
    const showDrop = team?.member_id === memberId && pool?.status === 'complete';

    if (!teams?.length || !pool) {
        return;
    }

    return (
        <Box p="20px" bg="rgba(255, 255, 255, 0.5)" boxShadow="md" borderRadius="6px" h="100%">
            <Heading fontWeight={300} pb={2}>
                Team
            </Heading>
            <Box pb={2} w="100%">
                {teamSelect && <Select items={teamSelect} value={value} onChange={(e) => setValue(e)} />}
            </Box>
            {round?.round_settings && (
                <VStack w="100%">
                    {Array.from({ length: qbCount }).map((_, index) => (
                        <PlayerItem
                            key={index}
                            player={displayTeam?.qbs?.[index]}
                            position="QB"
                            dropPlayer={showDrop ? dropPlayer : null}
                        />
                    ))}
                    {Array.from({ length: rbCount }).map((_, index) => (
                        <PlayerItem
                            key={index}
                            player={displayTeam?.rbs?.[index]}
                            position="RB"
                            dropPlayer={showDrop ? dropPlayer : null}
                        />
                    ))}
                    {Array.from({ length: wrCount }).map((_, index) => (
                        <PlayerItem
                            key={index}
                            player={displayTeam?.wrs?.[index]}
                            position="WR"
                            dropPlayer={showDrop ? dropPlayer : null}
                        />
                    ))}
                    {Array.from({ length: teCount }).map((_, index) => (
                        <PlayerItem
                            key={index}
                            player={displayTeam?.tes?.[index]}
                            position="TE"
                            dropPlayer={showDrop ? dropPlayer : null}
                        />
                    ))}
                    {Array.from({ length: flexCount }).map((_, index) => (
                        <PlayerItem
                            key={index}
                            player={displayTeam?.flexs?.[index]}
                            position="F"
                            dropPlayer={showDrop ? dropPlayer : null}
                        />
                    ))}
                    {Array.from({ length: sfCount }).map((_, index) => (
                        <PlayerItem
                            key={index}
                            player={displayTeam?.sfs?.[index]}
                            position="SF"
                            dropPlayer={showDrop ? dropPlayer : null}
                        />
                    ))}
                </VStack>
            )}
        </Box>
    );
}

function PlayerItem({
    player,
    position,
    dropPlayer
}: {
    dropPlayer: (player_id) => void;
    player?: Player;
    position: string;
}) {
    return (
        <HStack w="100%">
            <Center
                bg="linear-gradient(169deg, rgba(214,238,251,1) 0%, rgba(224,239,236,1) 40%, rgba(229,239,231,1) 100%)"
                h="40px"
                w="40px"
                fontSize="12px"
                borderRadius="20px"
            >
                {position}
            </Center>
            {player ? (
                <>
                    <Text fontSize="12px" textAlign={'left'}>
                        {player.name}
                    </Text>
                    {dropPlayer && <Button onClick={() => dropPlayer(player.id)}>X</Button>}
                </>
            ) : (
                <Box>
                    <Text color="gray.400" fontSize="12px" fontWeight={100}>
                        None Drafted
                    </Text>
                </Box>
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

    console.log(counts);
    if (!team || !counts.qbCount) {
        return {};
    }

    for (const player of team.team_players) {
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
