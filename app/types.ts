export interface Member {
    id: number,
    email: string,
    user_id: string,
    status: 'pending' | 'accepted'
}

export interface Player {
    id: number,
    is_te: boolean,
    is_rb: boolean,
    is_wr: boolean,
    is_qb: boolean,
    name: string,
    team_id: number
    nfl_team: NFLTeam
}

export interface NFLTeam {
    id: number,
    name: string
}

export interface TeamPlayer {
    id: number,
    player_id: number,
    team_id: number
    pool_id: number
    player: Player
}

export interface Pool {
    id: number,
    league_id: number,
    round_id: number,
    name: string
}

export interface NFLRound {
    id: number,
    round: number,
    year: number,
    status: 'pending' | 'drafting' | 'started' | 'finished'
    round_settings: RoundSettings[]
}

export interface RoundSettings {
    id: number;
    rb_count: number;
    flex_count: number;
    qb_count: number;
    wr_count: number;
    te_count: number;
    sf_count: number;
    rb_ppr: number;
    wr_ppr: number;
    te_ppr: number;
    pass_td: number;
    rush_td: number;
    rec_td: number;
    rush_yd: number;
    rec_yd: number;
    pass_yd: number;
    fum: number;
    int: number;
    round_id: bigint;
    league_id: bigint;
}