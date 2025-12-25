'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/utils/supabase/client';
import { GrHomeRounded } from 'react-icons/gr';
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
        <div className="flex flex-col justify-between items-center p-4 bg-black fixed left-0 top-0 z-10 shadow-sm h-screen pr-8">
            <div className="flex flex-col gap-2">
                <Button variant="ghost" className="p-2">
                    <Link href="/">
                        <GrHomeRounded className="text-xl" />
                    </Link>
                </Button>

                <Button
                    className="rounded-full w-10 h-10"
                    variant={tab === 'scoreboard' ? 'solid' : 'ghost'}
                    onClick={() => changeTab('scoreboard')}
                >
                    <MdOutlineScoreboard className="text-xl" />
                </Button>

                <Button
                    className="rounded-full w-10 h-10"
                    variant={tab === 'draft' ? 'solid' : 'ghost'}
                    onClick={() => changeTab('draft')}
                >
                    <MdAssignment className="text-xl" />
                </Button>

                {league?.admin_id === user?.id && (
                    <Button
                        className="rounded-full w-10 h-10"
                        variant={tab === 'manage' ? 'solid' : 'ghost'}
                        onClick={() => changeTab('manage')}
                    >
                        <MdAdminPanelSettings className="text-xl" />
                    </Button>
                )}

                {league?.admin_id === user?.id && (
                    <Button
                        className="rounded-full w-10 h-10"
                        variant={tab === 'teams' ? 'solid' : 'ghost'}
                        onClick={() => changeTab('teams')}
                    >
                        <MdOutlinePeopleAlt className="text-xl" />
                    </Button>
                )}
                <Separator className="my-2" />
                {leagues?.map((x) => (
                    <Tooltip content={x.name} key={x.id}>
                        <Button className="rounded-full" variant={league_id == x.id ? 'solid' : 'ghost'}>
                            <Link href={`/leagues/${x.id}`}>{x.name[0].toUpperCase()}</Link>
                        </Button>
                    </Tooltip>
                ))}
            </div>
            <Button onClick={handleSignOut} variant="ghost" className="p-2">
                <HiOutlineLogout className="text-xl" />
            </Button>
        </div>
    );
}
