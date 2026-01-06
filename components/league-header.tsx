'use client';
import { loadRounds } from '@/actions/league';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useURLState } from '@/hooks/use-url-state';
import { useLeagueStore } from '@/stores/league-store';
import { useUserStore } from '@/stores/user-store';
import { mapRound } from '@/utils';
import { NFLRound } from '@/app/types';

export function LeagueHeader() {
    const { tab, round_id, updateURLState } = useURLState();
    const league = useLeagueStore((state) => state.currentLeague);
    const user = useUserStore((state) => state.user);
    const [rounds, setRounds] = useState<NFLRound[]>([]);

    // Load rounds from database
    useEffect(() => {
        const fetchRounds = async () => {
            if (league?.id) {
                const { data } = await loadRounds(league.id);
                if (data) {
                    setRounds(data);
                }
            }
        };
        fetchRounds();
    }, [league?.id]);

    // Tab navigation
    const changeTab = useCallback((newTab: string) => {
        updateURLState({ tab: newTab });
    }, [updateURLState]);

    // Round selection
    const changeRound = useCallback((newRound: string) => {
        updateURLState({ round: newRound });
    }, [updateURLState]);

    useEffect(() => {
        console.log(round_id, rounds,)
        if (!round_id && rounds.length) {
            console.log('change round', rounds[0].id)
            changeRound(rounds[0].id)
        }
    }, [round_id, rounds, changeRound])

    // Responsive layout
    const [innerWidth, setInnerWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    useEffect(() => {
        const handleResize = () => setInnerWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const isMobile = innerWidth < 768;

    return (
        <div className={`flex justify-between items-center w-full flex-wrap ${isMobile ? 'py-2' : 'py-5'}`}>
            {!isMobile && (
                <div className="flex gap-2">
                    <Button
                        variant={tab === 'scoreboard' ? 'solid' : 'secondary'}
                        className="tracking-mono" size="sm"
                        onClick={() => changeTab('scoreboard')}
                    >
                        SCOREBOARD
                    </Button>
                    <Button
                        onClick={() => changeTab('draft')}
                        variant={tab === 'draft' ? 'solid' : 'secondary'}
                        className="tracking-mono" size="sm"
                    >
                        DRAFT
                    </Button>
                    {league?.admin_id === user?.id && (
                        <Button
                            onClick={() => changeTab('settings')}
                            variant={tab === 'settings' ? 'solid' : 'secondary'}
                            className="tracking-mono" size="sm"
                        >
                            SETTINGS
                        </Button>
                    )}
                    {league?.admin_id === user?.id && (
                        <Button
                            onClick={() => changeTab('teams')}
                            variant={tab === 'teams' ? 'solid' : 'secondary'}
                            className="tracking-mono" size="sm"
                        >
                            TEAMS
                        </Button>
                    )}
                </div>
            )}
            <div className={`flex ${isMobile ? 'flex-col w-full' : 'flex-row'} items-start gap-2`}>
                <div className={isMobile ? 'w-full' : ''}>
                    <Select value={round_id} onValueChange={changeRound}>
                        <SelectTrigger className={isMobile ? 'w-full h-8 text-xs' : 'w-[200px]'}>
                            <SelectValue placeholder="Select round" />
                        </SelectTrigger>
                        <SelectContent>
                            {rounds.map((round) => (
                                <SelectItem key={round.id} value={round.id}>
                                    {mapRound(round.round)} {round.year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
