export interface Member {
    id: number,
    email: string,
    user_id: string,
    status: 'pending' | 'accepted'
}

export interface Stats {
    id: number
    player_id: number
    game_id: number
    rec_yds: number		
    rec: number
    tar: number
    rush_yds: number
    rush_att: number
    comp: number
    pass_yds: number
    pass_att: number
    fum: number
    int: number
    rush_td: number
    rec_td: number
    pass_td: number
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
    stats?: Stats
}

export interface NFLTeam {
    id: number,
    name: string
}

export interface Team {
    id: number
    name: string,
    pool_id: number,
    member_id: number,
    team_players: TeamPlayer[]
}

export interface TeamPlayer {
    id: number,
    player_id: number,
    team_id: number
    pool_id: number
    team: Team
    player: Player
    score: number
}

export interface Pool {
    id: number,
    status: 'drafting' | 'complete'
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