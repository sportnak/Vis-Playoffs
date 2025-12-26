import { Player, PlayerPosition } from '@/app/types';

/**
 * Get the player's position, supporting both new enum and legacy boolean format
 * This helper function allows the app to work during the migration period
 */
export function getPlayerPosition(player: Player): PlayerPosition | null {
    // Prefer the new position field
    if (player.position) {
        return player.position;
    }

    // Fallback to legacy boolean fields
    if (player.is_qb) return 'QB';
    if (player.is_rb) return 'RB';
    if (player.is_wr) return 'WR';
    if (player.is_te) return 'TE';

    return null;
}

/**
 * Check if a player matches a specific position
 * Supports both new enum and legacy boolean format
 */
export function isPlayerPosition(player: Player, position: PlayerPosition): boolean {
    const playerPos = getPlayerPosition(player);
    return playerPos === position;
}

/**
 * Check if a player is eligible for FLEX position (RB, WR, or TE)
 */
export function isFlexEligible(player: Player): boolean {
    const position = getPlayerPosition(player);
    return position === 'RB' || position === 'WR' || position === 'TE';
}

/**
 * Check if a player is eligible for SuperFlex position (QB, RB, WR, or TE)
 */
export function isSuperFlexEligible(player: Player): boolean {
    const position = getPlayerPosition(player);
    return position !== null;
}

/**
 * Get all players of a specific position from an array
 */
export function filterByPosition(players: Player[], position: PlayerPosition): Player[] {
    return players.filter(player => isPlayerPosition(player, position));
}

/**
 * Count players by position
 */
export function countByPosition(players: Player[], position: PlayerPosition): number {
    return players.filter(player => isPlayerPosition(player, position)).length;
}
