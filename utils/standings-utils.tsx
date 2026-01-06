import { Trophy, Medal, Award } from 'lucide-react';

/**
 * Get the rank icon for top 3 positions
 */
export function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Award className="h-4 w-4 text-amber-700" />;
    return null;
}

/**
 * Get badge variant based on rank
 */
export function getRankBadgeVariant(rank: number): 'default' | 'secondary' | 'outline' {
    if (rank === 1) return 'default';
    if (rank === 2) return 'secondary';
    if (rank === 3) return 'outline';
    return 'outline';
}

/**
 * Get initials from email
 */
export function getInitials(email: string): string {
    return email.substring(0, 2).toUpperCase();
}

/**
 * Calculate points back from leader
 */
export function calculatePointsBack(teamScore: number, leaderScore: number): number {
    return parseFloat((teamScore - leaderScore).toFixed(2));
}

/**
 * Get color class for points back status
 */
export function getPointsBackColor(pointsBack: number): string {
    if (pointsBack === 0) return 'text-cyan';
    if (pointsBack < -20) return 'text-semantic-danger';
    if (pointsBack < -10) return 'text-semantic-warning';
    if (pointsBack < -5) return 'text-semantic-good';
    return 'text-cyan';
}

/**
 * Get formatted points back text
 */
export function getPointsBackText(pointsBack: number): string {
    return pointsBack === 0 ? 'Leading' : `${pointsBack} back`;
}
