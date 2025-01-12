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
    SelectValueText,
    VStack
} from '@chakra-ui/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import teams from './teams';
import { toaster } from './ui/toaster';
import { useMember, useTeam } from '@/app/leagues/[league_id]/draft/hooks';
import { useParams } from 'next/navigation';
import { useApp, useAppDispatch, useAppSelector, useLeague, useUser } from '@/app/hooks';
import { useRounds } from '@/app/leagues/[league_id]/manage/hooks';
import { InputGroup } from './ui/input-group';
import { BiChevronDown } from 'react-icons/bi';
import { Select } from './select';
import { PiPencil } from 'react-icons/pi';
import { LuPencil } from 'react-icons/lu';
import { setRoundId, setTab, setTeamName } from '@/store/appSlice';

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
    const { league_id } = useParams();
    const { tab, user, teamName, team } = useAppSelector((state) => state.app);
    const dispatch = useAppDispatch();
    const { league } = useLeague(league_id as string);
    const [selectedRoundId, setValue] = useState('2');

    const changeTab = useCallback((tab: string) => {
        dispatch(setTab(tab));
    }, []);

    const changeRound = useCallback((round_id: number) => {
        dispatch(setRoundId(round_id));
    }, []);
    useEffect(() => {
        changeRound(parseInt(selectedRoundId));
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

    const Component = isMobile ? VStack : HStack;
    return (
        <HStack
            justifyContent="space-between"
            alignItems="center"
            style={{
                width: '100%',
                paddingTop: '20px',
                paddingBottom: '20px'
            }}
            flexWrap={'wrap'}
        >
            {!isMobile && (
                <HStack>
                    <Button
                        variant="plain"
                        _hover={{
                            textDecoration: 'underline'
                        }}
                        onClick={() => changeTab('scoreboard')}
                        style={
                            tab === 'scoreboard'
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
                        onClick={() => changeTab('draft')}
                        variant="plain"
                        _hover={{ textDecoration: 'underline' }}
                        style={
                            tab === 'draft'
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
                            onClick={() => changeTab('manage')}
                            variant="plain"
                            _hover={{ textDecoration: 'underline' }}
                            style={
                                tab === 'manage'
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
                    {league?.admin_id === user?.id && (
                        <Button
                            onClick={() => changeTab('teams')}
                            variant="plain"
                            _hover={{ textDecoration: 'underline' }}
                            style={
                                tab === 'teams'
                                    ? {
                                          fontWeight: 'bold',
                                          textDecoration: 'underline'
                                      }
                                    : null
                            }
                        >
                            Teams
                        </Button>
                    )}
                </HStack>
            )}
            <Component alignItems="flex-start">
                <Box>
                    <Select
                        value={roundItems.items.find((x) => x.value === selectedRoundId)}
                        items={roundItems.items}
                        onChange={(e) => setValue(e.value)}
                    />
                </Box>
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
                            value={localName}
                            onChange={handleNameChange}
                            w="250px"
                            placeholder="Name"
                        />
                    </InputGroup>
                </Box>
            </Component>
        </HStack>
    );
}
