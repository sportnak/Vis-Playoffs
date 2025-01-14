'use client';
import Link from 'next/link';
import { Box, Button, Icon, Separator, Theme, VStack } from '@chakra-ui/react';
import { createClient } from '@/utils/supabase/client';
import { GrHomeRounded, GrScorecard } from 'react-icons/gr';
import { HiOutlineLogout } from 'react-icons/hi';
import { useAppDispatch, useAppSelector, useLeague, useLeagues } from '@/app/hooks';
import { Tooltip } from './ui/tooltip';
import { useParams } from 'next/navigation';
import { setTab } from '@/store/appSlice';
import { useCallback } from 'react';
import { MdAdminPanelSettings, MdAssignment, MdOutlinePeopleAlt, MdOutlineScoreboard } from 'react-icons/md';

export default function Header() {
    const { league_id } = useParams();
    const { tab, user, teamName, team } = useAppSelector((state) => state.app);
    const { league } = useLeague(league_id as string);
    const dispatch = useAppDispatch();
    const handleSignOut = async () => {
        // Logic for signing out the user
        const client = await createClient();
        await client.auth.signOut();
        window.location.href = '/login';
    };

    const changeTab = useCallback((tab: string) => {
        dispatch(setTab(tab));
    }, []);

    const { leagues } = useLeagues();

    return (
        <Theme appearance="dark">
            <VStack
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: 'black', // Darkened background
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    zIndex: 10,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    height: '100vh',
                    paddingRight: '30px'
                }}
            >
                <VStack>
                    <Button variant="ghost">
                        <Link href="/">
                            <Icon fontSize="20px">
                                <GrHomeRounded />
                            </Icon>
                        </Link>
                    </Button>

                    <Button
                        borderRadius="50%"
                        w="40px"
                        variant={tab === 'scoreboard' ? 'solid' : 'ghost'}
                        onClick={() => changeTab('scoreboard')}
                    >
                        <Icon fontSize="20px">
                            <MdOutlineScoreboard />
                        </Icon>
                    </Button>

                    <Button
                        borderRadius="50%"
                        w="40px"
                        variant={tab === 'draft' ? 'solid' : 'ghost'}
                        onClick={() => changeTab('draft')}
                    >
                        <Icon fontSize="20px">
                            <MdAssignment />
                        </Icon>
                    </Button>

                    {league?.admin_id === user?.id && (
                        <Button
                            borderRadius="50%"
                            w="40px"
                            variant={tab === 'manage' ? 'solid' : 'ghost'}
                            onClick={() => changeTab('manage')}
                        >
                            <Icon fontSize="20px">
                                <MdAdminPanelSettings />
                            </Icon>
                        </Button>
                    )}

                    {league?.admin_id === user?.id && (
                        <Button
                            borderRadius="50%"
                            w="40px"
                            variant={tab === 'teams' ? 'solid' : 'ghost'}
                            onClick={() => changeTab('teams')}
                        >
                            <Icon fontSize="20px">
                                <MdOutlinePeopleAlt />
                            </Icon>
                        </Button>
                    )}
                    <Separator />
                    {leagues?.map((x) => (
                        <Tooltip content={x.name} key={x.id}>
                            <Button borderRadius={'50%'} variant={league_id == x.id ? 'solid' : 'surface'}>
                                <Link href={`/leagues/${x.id}`}>{x.name[0].toUpperCase()}</Link>
                            </Button>
                        </Tooltip>
                    ))}
                </VStack>
                <Button onClick={handleSignOut} variant="ghost">
                    <Icon fontSize="20px">
                        <HiOutlineLogout />
                    </Icon>
                </Button>
            </VStack>
        </Theme>
    );
}
