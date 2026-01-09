export interface Member {
    id: string,
    email: string,
    user_id: string,
    status: 'pending' | 'active',
    role?: 'admin' | 'member'
}

export interface League {
    id: string
    admin_id: string
    name: string
    description?: string
    team: Team[]
    league_members: Member[]
}

export interface Stats {
    id: string
    player_id: string
    game_id: string
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

export type PlayerPosition = 'QB' | 'RB' | 'WR' | 'TE';

export interface Player {
    id: string,
    // New position field (preferred)
    position?: PlayerPosition,
    // Legacy boolean fields (deprecated, will be removed)
    is_te?: boolean,
    is_rb?: boolean,
    is_wr?: boolean,
    is_qb?: boolean,
    name: string,
    team_id: string
    nfl_team: NFLTeam
    stats?: Stats
}

export interface NFLTeam {
    id: string,
    name: string
}

export interface Team {
    id: string
    name: string,
    pool_id: string,
    member_id: string,
    team_players: TeamPlayer[]
    total_draft_time_seconds?: number
}

export interface TeamPlayer {
    id: string,
    player_id: string,
    team_id: string
    pool_id: string
    team: Team
    player: Player
    score: number
}

export interface Pool {
    id: string,
    status: 'drafting' | 'complete'
    draft_order?: string[],
    current?: string,
    pick_number?: number,
    league_id: string,
    round_id: string,
    name: string
}

export interface NFLRound {
    id: string,
    round: number,
    year: number,
    status: 'pending' | 'drafting' | 'started' | 'finished'
    round_settings: RoundSettings[]
    pools: Pool[]
}

export interface RoundSettings {
    id: string;
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
    round_id: string;
    league_id: string;
}