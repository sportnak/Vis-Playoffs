import {
    Text,
    Box,
    createListCollection,
    HStack,
    VStack,
    Button,
    Heading,
    Center,
    Table,
    Grid
} from '@chakra-ui/react';
import { SelectContent, SelectItem, SelectLabel, SelectRoot, SelectTrigger, SelectValueText } from './ui/select';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NFLRound, Player, Pool, RoundSettings, Stats, Team, TeamPlayer } from '@/app/types';
import { toaster } from './ui/toaster';
import { mapPos } from '@/app/util';
import { Select } from './select';
import { Tooltip } from './ui/tooltip';
import { set } from 'react-hook-form';

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
    const [value, setValue] = useState<any>({});
    useEffect(() => {
        const team = teams?.find((team) => team.member_id === memberId);
        if (!team) {
            return;
        }
        setValue({ value: team.id, label: team.name });
    }, [memberId, teams]);

    const team = useMemo(() => teams?.find((team) => team.id == value?.value), [teams, value]);
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
            <TeamCard showScore={false} team={team} round={round} pool={pool} memberId={memberId} />
        </Box>
    );
}

export function TeamCard({ team, round, pool, memberId, showScore }) {
    const qbCount = useMemo(() => round?.round_settings[0]?.qb_count, [round]);
    const wrCount = useMemo(() => round?.round_settings[0]?.wr_count, [round]);
    const rbCount = useMemo(() => round?.round_settings[0]?.rb_count, [round]);
    const teCount = useMemo(() => round?.round_settings[0]?.te_count, [round]);
    const flexCount = useMemo(() => round?.round_settings[0]?.flex_count, [round]);
    const sfCount = useMemo(() => round?.round_settings[0]?.sf_count, [round]);
    const showDrop = false; //team?.member_id === memberId && pool?.status === 'complete';

    const handleDropPlayer = useCallback((player_id: number) => {
        window.alert('Dropping' + player_id);
    }, []);
    const displayTeam = useMemo(() => {
        return createTeam(
            team,
            {
                qbCount,
                wrCount,
                rbCount,
                teCount,
                flexCount,
                sfCount
            },
            pool?.id
        );
    }, [qbCount, pool?.id, wrCount, rbCount, teCount, flexCount, team, sfCount]);
    return (
        round?.round_settings && (
            <VStack w="100%">
                {Array.from({ length: qbCount }).map((_, index) => (
                    <PlayerItem
                        showScore={showScore}
                        key={index}
                        player={displayTeam?.qbs?.[index]}
                        position="QB"
                        dropPlayer={showDrop ? handleDropPlayer : null}
                    />
                ))}
                {Array.from({ length: rbCount }).map((_, index) => (
                    <PlayerItem
                        showScore={showScore}
                        key={index}
                        player={displayTeam?.rbs?.[index]}
                        position="RB"
                        dropPlayer={showDrop ? handleDropPlayer : null}
                    />
                ))}
                {Array.from({ length: wrCount }).map((_, index) => (
                    <PlayerItem
                        showScore={showScore}
                        key={index}
                        player={displayTeam?.wrs?.[index]}
                        position="WR"
                        dropPlayer={showDrop ? handleDropPlayer : null}
                    />
                ))}
                {Array.from({ length: teCount }).map((_, index) => (
                    <PlayerItem
                        showScore={showScore}
                        key={index}
                        player={displayTeam?.tes?.[index]}
                        position="TE"
                        dropPlayer={showDrop ? handleDropPlayer : null}
                    />
                ))}
                {Array.from({ length: flexCount }).map((_, index) => (
                    <PlayerItem
                        showScore={showScore}
                        key={index}
                        player={displayTeam?.flexs?.[index]}
                        position="F"
                        dropPlayer={showDrop ? handleDropPlayer : null}
                    />
                ))}
                {Array.from({ length: sfCount }).map((_, index) => (
                    <PlayerItem
                        showScore={showScore}
                        key={index}
                        player={displayTeam?.sfs?.[index]}
                        position="SF"
                        dropPlayer={showDrop ? handleDropPlayer : null}
                    />
                ))}
            </VStack>
        )
    );
}

function PlayerItem({
    player,
    position,
    dropPlayer,
    showScore
}: {
    dropPlayer: (player_id) => void;
    player?: TeamPlayer;
    position: string;
    showScore?: boolean;
}) {
    const stats = (player as any)?.stats;
    const [open, setOpen] = useState(false);
    return (
        <Tooltip
            interactive
            contentProps={{
                css: {
                    '--tooltip-bg': 'rgba(255, 255, 255, 1)',
                    borderRadius: '6px'
                }
            }}
            disabled={stats == null}
            content={<Points player={player} />}
            open={open}
            onOpenChange={(e) => setOpen(e.open)}
        >
            <HStack
                w="100%"
                justifyContent={'space-between'}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onClick={() => setOpen((op) => !op)}
            >
                <HStack>
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
                                {player.player.name}
                            </Text>
                            {dropPlayer && <Button onClick={() => dropPlayer(player.player.id)}>X</Button>}
                        </>
                    ) : (
                        <Box>
                            <Text color="gray.400" fontSize="12px" fontWeight={100}>
                                None Drafted
                            </Text>
                        </Box>
                    )}
                </HStack>
                {showScore && player && (
                    <Text
                        fontSize="12px"
                        fontWeight={'bold'}
                        color={
                            (player as any)?.stats == null
                                ? 'black'
                                : player.score < 5
                                  ? '#f94144'
                                  : player.score < 10
                                    ? '#f9844a'
                                    : player.score < 20
                                      ? '#90be6d'
                                      : '#277da1'
                        }
                    >
                        {player?.score} pts
                    </Text>
                )}
            </HStack>
        </Tooltip>
    );
}
const wr_stats = ['rec', 'rec_yds', 'rec_td', 'fum', 'rush_att', 'rush_yds', 'rush_td'];
const rb_stats = ['rush_att', 'rush_yds', 'rush_td', 'fum', 'rec', 'rec_yds', 'rec_td'];
const qb_stats = ['pass_att', 'pass_yds', 'pass_td', 'rush_att', 'rush_yds', 'rush_td', 'fum', 'int'];
export function mapStatName(stat) {
    switch (stat) {
        case 'pass_att':
            return 'Passing';
        case 'pass_yds':
            return 'Passing Yds';
        case 'pass_td':
            return 'Passing TD';
        case 'rush_att':
            return 'Rushing';
        case 'rush_yds':
            return 'Rushing Yds';
        case 'rush_td':
            return 'Rushing TD';
        case 'fum':
            return 'Fumbles';
        case 'int':
            return 'Ints';
        case 'rec':
            return 'Receptions';
        case 'rec_yds':
            return 'Rec Yds';
        case 'rec_td':
            return 'Rec TD';
        default:
            return stat;
    }
}
function Points({ player }: { player: TeamPlayer }) {
    const stats = (player as any)?.stats;
    const stat_columns = player.player.is_qb ? qb_stats : player.player.is_rb ? rb_stats : wr_stats;
    return (
        <Box color="black" p={4}>
            <Heading fontSize="14px" mb={2} fontWeight={'bold'}>
                POINTS: {player.score}
            </Heading>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {stat_columns?.map((stat) => (
                    <VStack alignItems={'flex-start'} key={stat} gap={0.5}>
                        <Text color={'gray.500'} fontSize="12px">
                            {mapStatName(stat).toUpperCase()}
                        </Text>
                        <Text fontSize="12px" fontWeight={'bold'}>
                            {stat === 'pass_att'
                                ? `${stats['comp']}/${stats[stat]}`
                                : stat === 'rec'
                                  ? `${stats[stat]}/${stats['tar']}`
                                  : (stats[stat] ?? 0)}
                        </Text>
                    </VStack>
                ))}
            </Grid>
        </Box>
    );
}

function createTeam(team: Team, counts, poolId: number) {
    const qbs = [];
    const rbs = [];
    const tes = [];
    const wrs = [];
    const flexs = [];
    const sfs = [];

    if (!team || !counts.qbCount) {
        return {};
    }

    for (const player of team.team_players.filter((x) => x.pool_id === poolId)) {
        if (player.player.is_qb) {
            if (qbs.length < counts.qbCount) {
                qbs.push(player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player);
            }
        }

        if (player.player.is_rb) {
            if (rbs.length < counts.rbCount) {
                rbs.push(player);
            } else if (flexs.length < counts.flexCount) {
                flexs.push(player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player);
            }
        }

        if (player.player.is_wr) {
            if (wrs.length < counts.wrCount) {
                wrs.push(player);
            } else if (flexs.length < counts.flexCount) {
                flexs.push(player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player);
            }
        }

        if (player.player.is_te) {
            if (tes.length < counts.teCount) {
                tes.push(player);
            } else if (flexs.length < counts.flexCount) {
                flexs.push(player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player);
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
