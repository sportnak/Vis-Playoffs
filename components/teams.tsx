import { useCallback, useEffect, useMemo, useState } from 'react';
import { NFLRound, Player, Pool, RoundSettings, Stats, Team, TeamPlayer } from '@/app/types';
import { toaster } from './ui/toaster';
import { mapPos } from '@/app/util';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip } from './ui/tooltip';
import { Button } from './ui/button';
import { H3, P } from './ui/text';

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
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');

    useEffect(() => {
        const team = teams?.find((team) => team.member_id === memberId);
        if (!team) {
            return;
        }
        setSelectedTeamId(team.id.toString());
    }, [memberId, teams]);

    const team = useMemo(() => teams?.find((team) => team.id.toString() === selectedTeamId), [teams, selectedTeamId]);
    if (!teams?.length || !pool) {
        return;
    }

    return (
        <div className="p-5 bg-white/50 shadow-md rounded-md h-full">
            <H3 className="font-light pb-2">
                Team
            </H3>
            <div className="pb-2 w-full">
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                        {teams?.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                                {team.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <TeamCard showScore={false} team={team} round={round} pool={pool} memberId={memberId} />
        </div>
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
            <div className="w-full space-y-2">
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
            </div>
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
            <div
                className="w-full flex justify-between items-center"
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onClick={() => setOpen((op) => !op)}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-xs"
                        style={{
                            background: 'linear-gradient(169deg, rgba(214,238,251,1) 0%, rgba(224,239,236,1) 40%, rgba(229,239,231,1) 100%)'
                        }}
                    >
                        {position}
                    </div>
                    {player ? (
                        <>
                            <span className="text-xs text-left text-frost">
                                {player.player.name}
                            </span>
                            {dropPlayer && <Button size="sm" onClick={() => dropPlayer(player.player.id)}>X</Button>}
                        </>
                    ) : (
                        <div>
                            <span className="text-cool-gray text-xs font-light">
                                None Drafted
                            </span>
                        </div>
                    )}
                </div>
                {showScore && player && (
                    <span
                        className="text-xs font-bold"
                        style={{
                            color: (player as any)?.stats == null
                                ? 'black'
                                : player.score < 5
                                  ? '#f94144'
                                  : player.score < 10
                                    ? '#f9844a'
                                    : player.score < 20
                                      ? '#90be6d'
                                      : '#277da1'
                        }}
                    >
                        {player?.score} pts
                    </span>
                )}
            </div>
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
        <div className="text-black p-4">
            <h4 className="text-sm mb-2 font-bold">
                POINTS: {player.score}
            </h4>
            <div className="grid grid-cols-2 gap-4">
                {stat_columns?.map((stat) => (
                    <div className="flex flex-col items-start gap-0.5" key={stat}>
                        <span className="text-cool-gray text-xs">
                            {mapStatName(stat).toUpperCase()}
                        </span>
                        <span className="text-xs font-bold">
                            {stat === 'pass_att'
                                ? `${stats['comp']}/${stats[stat]}`
                                : stat === 'rec'
                                  ? `${stats[stat]}/${stats['tar']}`
                                  : (stats[stat] ?? 0)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
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
