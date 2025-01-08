import { Player } from "./types";

export function mapPos(player: Player) {
    if (player.is_qb) {
        return 'QB'
    }
    if (player.is_rb) {
        return 'RB'
    }
    if (player.is_wr) {
        return 'WR'
    }
    if (player.is_te) {
        return 'TE'
    }
}