import { useCallback, useEffect, useMemo, useState } from 'react';
import { NFLRound, Player, Pool, RoundSettings, Stats, Team, TeamPlayer } from '@/app/types';
import { toaster } from './ui/toaster';
import { mapPos } from '@/app/util';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip } from './ui/tooltip';
import { Button } from './ui/button';
import { H3, P } from './ui/text';
import { getPlayerPosition, isPlayerPosition, isFlexEligible, isSuperFlexEligible } from '@/utils/player-position';

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
        <div className="bg-steel border border-ui-border shadow-md rounded-md h-full">
            <div className="px-4 py-2 w-full gap-4 items-center flex flex-row border-b border-ui-border">
                <P className="font-light font-roboto-mono text-sm tracking-[0.025rem]">
                    TEAM
                </P>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger className="h-7">
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
            <div className="p-4">

                <TeamCard showScore={false} team={team} round={round} pool={pool} memberId={memberId} />
            </div>
        </div>
    );
}

export function TeamCard({ team, round, pool, memberId, showScore }) {
    const qbCount = useMemo(() => round?.round_settings[0]?.qb_count ?? 0, [round]);
    const wrCount = useMemo(() => round?.round_settings[0]?.wr_count ?? 0, [round]);
    const rbCount = useMemo(() => round?.round_settings[0]?.rb_count ?? 0, [round]);
    const teCount = useMemo(() => round?.round_settings[0]?.te_count ?? 0, [round]);
    const flexCount = useMemo(() => round?.round_settings[0]?.flex_count ?? 0, [round]);
    const sfCount = useMemo(() => round?.round_settings[0]?.sf_count ?? 0, [round]);
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

    if (qbCount === 0 && wrCount === 0 && rbCount === 0 && teCount === 0 && flexCount === 0 && sfCount === 0) {
        return <div className="p-4 w-full flex flex-row justify-center"><P className="font-roboto-mono text-xs tracking-[0.025rem]">NO PLAYERS DRAFTED</P></div>
    }

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
                        className="tracking-mono h-10 w-10 rounded-full flex items-center justify-start text-xs"
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
                            <span className="tracking-mono text-cool-gray text-xs font-light">
                                EMPTY
                            </span>
                        </div>
                    )}
                </div>
                {showScore && player && (
                    <span
                        className={`text-xs font-bold ${(player as any)?.stats == null
                            ? 'text-cool-gray'
                            : player.score < 5
                                ? 'text-semantic-danger'
                                : player.score < 10
                                    ? 'text-semantic-warning'
                                    : player.score < 20
                                        ? 'text-semantic-good'
                                        : 'text-cyan'
                            }`}
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
    const position = getPlayerPosition(player.player);
    const stat_columns = position === 'QB' ? qb_stats : position === 'RB' ? rb_stats : wr_stats;
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

function createTeam(team: Team, counts, poolId: string) {
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
        const position = getPlayerPosition(player.player);

        if (position === 'QB') {
            if (qbs.length < counts.qbCount) {
                qbs.push(player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player);
            }
        }

        if (position === 'RB') {
            if (rbs.length < counts.rbCount) {
                rbs.push(player);
            } else if (flexs.length < counts.flexCount) {
                flexs.push(player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player);
            }
        }

        if (position === 'WR') {
            if (wrs.length < counts.wrCount) {
                wrs.push(player);
            } else if (flexs.length < counts.flexCount) {
                flexs.push(player);
            } else if (sfs.length < counts.sfCount) {
                sfs.push(player);
            }
        }

        if (position === 'TE') {
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
