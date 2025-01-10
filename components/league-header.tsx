import { updateName } from '@/actions/league';
import {
    Box,
    Button,
    Center,
    createListCollection,
    HStack,
    Icon,
    Input,
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectRoot,
    SelectTrigger,
    SelectValueText
} from '@chakra-ui/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import teams from './teams';
import { toaster } from './ui/toaster';
import { useMember, useTeam } from '@/app/leagues/[league_id]/draft/hooks';
import { useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector, useLeague, useUser } from '@/app/hooks';
import { useRounds } from '@/app/leagues/[league_id]/manage/hooks';
import { InputGroup } from './ui/input-group';
import { BiChevronDown } from 'react-icons/bi';
import { Select } from './select';
import { PiPencil } from 'react-icons/pi';
import { LuPencil } from 'react-icons/lu';
import { setRoundId, setTab } from '@/store/appSlice';

const roundItems = {
    items: [
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
    const app = useAppSelector((state) => state.app);
    const dispatch = useAppDispatch();
    const { league_id } = useParams();
    const { user } = useUser();
    const { member } = useMember(parseInt(league_id as string), user);
    const { team, updateName, load: refreshTeam } = useTeam(parseInt(league_id as string), member?.id);
    const { rounds } = useRounds(parseInt(league_id as string));
    const [teamName, setTeamName] = useState('');
    const { league } = useLeague(league_id as string);
    const [selectedRoundId, setValue] = useState('2');

    const handleTabChange = useCallback((val: string) => {
        dispatch(setTab(val));
    }, []);

    const handleRoundChange = useCallback((val: string) => {
        dispatch(setRoundId(val));
    }, []);

    useEffect(() => {
        handleRoundChange(selectedRoundId);
    }, [selectedRoundId]);

    useEffect(() => {
        if (!team?.name) {
            return;
        }
        const teamName = team?.name;
        setTeamName(teamName);
    }, [team, member]);

    const handleNameChange = useCallback((e) => {
        setTeamName(e.target.value);
    }, []);

    const db = useRef(null);
    useEffect(() => {
        if (!teamName?.length) {
            return;
        }
        if (db.current) {
            clearTimeout(db.current);
        }

        db.current = setTimeout(async () => {
            const res = await updateName(teamName);
            if (res && !res.error) {
                toaster.create({
                    type: 'success',
                    title: 'Team name updated'
                });
                refreshTeam();
            }
        }, 500);
    }, [teamName, updateName]);

    return (
        <HStack
            justifyContent="space-between"
            alignItems="center"
            style={{
                height: '100px',
                width: '100%',
                paddingTop: '20px',
                paddingBottom: '20px'
            }}
        >
            <Box>
                <Select
                    value={roundItems.items.find((x) => x.value === selectedRoundId)}
                    items={roundItems.items}
                    onChange={(e) => setValue(e.value)}
                />
            </Box>
            <HStack>
                <Button
                    variant="plain"
                    _hover={{
                        textDecoration: 'underline'
                    }}
                    onClick={() => handleTabChange('team')}
                    style={
                        app.tab === 'team'
                            ? {
                                  fontWeight: 'bold',
                                  textDecoration: 'underline'
                              }
                            : null
                    }
                >
                    Team
                </Button>
                <Button
                    variant="plain"
                    _hover={{
                        textDecoration: 'underline'
                    }}
                    onClick={() => handleTabChange('scoreboard')}
                    style={
                        app.tab === 'scoreboard'
                            ? {
                                  fontWeight: 'bold',
                                  textDecoration: 'underline'
                              }
                            : null
                    }
                >
                    Scoreboard
                </Button>
                <Button
                    onClick={() => handleTabChange('draft')}
                    variant="plain"
                    _hover={{ textDecoration: 'underline' }}
                    style={
                        app.tab === 'draft'
                            ? {
                                  fontWeight: 'bold',
                                  textDecoration: 'underline'
                              }
                            : null
                    }
                >
                    Draft
                </Button>
                {league?.admin_id === user?.id && (
                    <Button
                        onClick={() => handleTabChange('manage')}
                        variant="plain"
                        _hover={{ textDecoration: 'underline' }}
                        style={
                            app.tab === 'manage'
                                ? {
                                      fontWeight: 'bold',
                                      textDecoration: 'underline'
                                  }
                                : null
                        }
                    >
                        Manage
                    </Button>
                )}
            </HStack>
            <Box>
                <InputGroup
                    endElement={
                        <Icon fontSize="20px">
                            <LuPencil />
                        </Icon>
                    }
                >
                    <Input
                        variant="subtle"
                        style={{ background: 'rgba(169, 169, 169, 0.1)', fontSize: '14px' }}
                        value={teamName}
                        onChange={handleNameChange}
                        w="250px"
                        placeholder="Name"
                    />
                </InputGroup>
            </Box>
        </HStack>
    );
}
