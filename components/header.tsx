'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/utils/supabase/client';
import { GrHomeRounded } from 'react-icons/gr';
import { HiOutlineLogout } from 'react-icons/hi';
import { useLeague, useLeagues } from '@/app/hooks';
import { Tooltip } from './ui/tooltip';
import { useParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { MdAdminPanelSettings, MdAssignment, MdOutlinePeopleAlt, MdOutlineScoreboard } from 'react-icons/md';
import { Menu } from 'lucide-react';
import { useURLState } from '@/hooks/use-url-state';
import { useUserStore } from '@/stores/user-store';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Header() {
    const { league_id } = useParams();
    const { tab, updateURLState } = useURLState();
    const user = useUserStore((state) => state.user);
    const { league } = useLeague(league_id as string);
    const { leagues } = useLeagues();
    const [isMobile, setIsMobile] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleSignOut = async () => {
        const client = await createClient();
        await client.auth.signOut();
        window.location.href = '/login';
    };

    const changeTab = useCallback((newTab: string) => {
        updateURLState({ tab: newTab });
        setOpen(false);
    }, [updateURLState]);

    if (isMobile) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-ui-border">
                <div className="flex items-center justify-between p-3">
                    <Link href="/" className="text-frost font-bold text-lg">
                        {league?.name || 'Vis Playoffs'}
                    </Link>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-2">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 bg-black">
                            <div className="flex flex-col gap-4 mt-8">
                                <Button
                                    variant={tab === 'scoreboard' ? 'solid' : 'ghost'}
                                    className="justify-start gap-3"
                                    onClick={() => changeTab('scoreboard')}
                                >
                                    <MdOutlineScoreboard className="text-xl" />
                                    <span>Scoreboard</span>
                                </Button>

                                <Button
                                    variant={tab === 'draft' ? 'solid' : 'ghost'}
                                    className="justify-start gap-3"
                                    onClick={() => changeTab('draft')}
                                >
                                    <MdAssignment className="text-xl" />
                                    <span>Draft</span>
                                </Button>

                                {league?.admin_id === user?.id && (
                                    <Button
                                        variant={tab === 'settings' ? 'solid' : 'ghost'}
                                        className="justify-start gap-3"
                                        onClick={() => changeTab('settings')}
                                    >
                                        <MdAdminPanelSettings className="text-xl" />
                                        <span>Settings</span>
                                    </Button>
                                )}

                                {league?.admin_id === user?.id && (
                                    <Button
                                        variant={tab === 'teams' ? 'solid' : 'ghost'}
                                        className="justify-start gap-3"
                                        onClick={() => changeTab('teams')}
                                    >
                                        <MdOutlinePeopleAlt className="text-xl" />
                                        <span>Teams</span>
                                    </Button>
                                )}

                                <Separator className="my-2" />

                                {leagues?.map((x) => (
                                    <Button
                                        key={x.id}
                                        variant={league_id == x.id ? 'solid' : 'ghost'}
                                        className="justify-start"
                                        onClick={() => setOpen(false)}
                                    >
                                        <Link href={`/leagues/${x.id}`} className="w-full text-left">
                                            {x.name}
                                        </Link>
                                    </Button>
                                ))}

                                <Separator className="my-2" />

                                <Button
                                    onClick={handleSignOut}
                                    variant="ghost"
                                    className="justify-start gap-3 text-red-400"
                                >
                                    <HiOutlineLogout className="text-xl" />
                                    <span>Sign Out</span>
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-between items-center p-4 bg-black fixed left-0 top-0 z-10 shadow-sm h-screen pr-8">
            <div className="flex flex-col gap-2">
                <Tooltip content="Leagues">
                    <Button variant="ghost" className="p-2">
                        <Link href="/">
                            <GrHomeRounded className="text-xl" />
                        </Link>
                    </Button>
                </Tooltip>

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
                        variant={tab === 'settings' ? 'solid' : 'ghost'}
                        onClick={() => changeTab('settings')}
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
