export interface Member {
    id: number,
    email: string,
    user_id: string,
    status: 'pending' | 'accepted'
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