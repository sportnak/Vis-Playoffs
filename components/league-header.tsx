import { updateName } from '@/actions/league';
import { useState, useEffect, useCallback, useRef } from 'react';
import teams from './teams';
import { toaster } from './ui/toaster';
import { useMember, useTeam } from '@/app/leagues/[league_id]/draft/hooks';
import { useParams } from 'next/navigation';
import { useApp, useAppDispatch, useAppSelector, useLeague, useUser } from '@/app/hooks';
import { useRounds } from '@/app/leagues/[league_id]/manage/hooks';
import { LuPencil } from 'react-icons/lu';
import { setRoundId, setTab, setTeamName } from '@/store/appSlice';
import { Button } from './ui/button';
import { InputWithAddon } from './ui/input-with-addon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const roundItems = {
    items: [
        {
            value: '-2',
            label: 'Week 17'
        },
        {
            value: '-1',
            label: 'Week 18'
        },
        {
            value: '2',
            label: 'Wildcard'
        },
        {
            value: '3',
            label: 'Divisional'
        },
        {
            value: '4',
            label: 'Conference'
        }
    ]
};

export function LeagueHeader() {
    const { league_id } = useParams();
    const { tab, user, teamName, team } = useAppSelector((state) => state.app);
    const dispatch = useAppDispatch();
    const { league } = useLeague(league_id as string);
    const [selectedRoundId, setValue] = useState('4');

    const changeTab = useCallback((tab: string) => {
        dispatch(setTab(tab));
    }, []);

    const changeRound = useCallback((round_id: string) => {
        dispatch(setRoundId(round_id));
    }, []);
    useEffect(() => {
        changeRound(selectedRoundId);
    }, [selectedRoundId]);

    const [localName, setLocalName] = useState(teamName);
    useEffect(() => {
        setLocalName(teamName);
    }, [teamName]);

    const handleNameChange = useCallback((e) => {
        setLocalName(e.target.value);
    }, []);

    const db = useRef(null);
    useEffect(() => {
        if (!localName?.length || localName === team?.name) {
            return;
        }
        if (db.current) {
            clearTimeout(db.current);
        }

        db.current = setTimeout(async () => {
            const res = await updateName(localName, team?.id);
            dispatch(setTeamName(localName));
            if (res && !res.error) {
                toaster.create({
                    type: 'success',
                    title: 'Team name updated'
                });
            }
        }, 500);
    }, [localName, updateName]);
    const [innerWidth, setInnerWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setInnerWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const isMobile = innerWidth < 768;

    return (
        <div className="flex justify-between items-center w-full py-5 flex-wrap">
            {!isMobile && (
                <div className="flex gap-2">
                    <Button
                        variant={tab === 'scoreboard' ? 'solid' : 'secondary'}
                        className={`font-roboto-mono`}
                        onClick={() => changeTab('scoreboard')}
                    >
                        SCOREBOARD
                    </Button>
                    <Button
                        onClick={() => changeTab('draft')}
                        variant={tab === 'draft' ? 'solid' : 'secondary'}
                        className={`font-roboto-mono`}
                    >
                        DRAFT
                    </Button>
                    {league?.admin_id === user?.id && (
                        <Button
                            onClick={() => changeTab('settings')}
                            variant={tab === 'settings' ? 'solid' : 'secondary'}
                            className={`font-roboto-mono letter-spacing-[1.6px]`}
                        >
                            SETTINGS
                        </Button>
                    )}
                    {league?.admin_id === user?.id && (
                        <Button
                            onClick={() => changeTab('teams')}
                            variant={tab === 'teams' ? 'solid' : 'secondary'}
                            className={`font-roboto-mono`}
                        >
                            TEAMS
                        </Button>
                    )}
                </div>
            )}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-start gap-2`}>
                <div>
                    <Select value={roundItems.items.find((x) => x.value === selectedRoundId)?.value} onValueChange={(e) => setValue(e)}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select pool" />
                        </SelectTrigger>
                        <SelectContent>
                            {roundItems.items.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <InputWithAddon
                        endElement={<LuPencil className="text-xl" />}
                        className="bg-gray-100 dark:bg-gray-800 text-sm w-[250px]"
                        value={localName}
                        onChange={handleNameChange}
                        placeholder="Name"
                    />
                </div>
            </div>
        </div>
    );
}
