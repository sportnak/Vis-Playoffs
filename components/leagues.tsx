'use client';
import { useLeagues } from '@/app/hooks';
import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CreateLeagueDialog from './create-league-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { H2 } from './ui/text';
import { useUserStore } from '@/stores/user-store';

const LeaguesList = () => {
    const { leagues } = useLeagues();
    const user = useUserStore((state) => state.user);

    const router = useRouter();
    const setActiveLeague = useCallback((id: string) => {
        router.push(`/leagues/${id}`);
    }, [router]);

    if (leagues == null) {
        return (
            <div className="max-w-[90%] mx-auto p-8 flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[90%] p-8">
            <div className="flex justify-between items-center pb-6">
                <H2 className="font-normal">Leagues</H2>
                <CreateLeagueDialog />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">League Name</TableHead>
                        <TableHead className="w-[30%]">Description</TableHead>
                        <TableHead className="w-[15%] text-center">Teams</TableHead>
                        <TableHead className="w-[15%] text-center">Role</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leagues.map((league) => (
                        <TableRow
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            key={league.id}
                            onClick={() => setActiveLeague(league.id)}
                        >
                            <TableCell className="font-medium">{league.name}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                                {league.description || <span className="italic text-gray-400">No description</span>}
                            </TableCell>
                            <TableCell className="text-center">{league.team?.length || 0}</TableCell>
                            <TableCell className="text-center">
                                {(() => {
                                    const userMember = league.league_members?.find(m => m.user_id === user?.id);
                                    const isAdmin = userMember?.role === 'admin';
                                    return isAdmin ? (
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                                            Admin
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                                            Member
                                        </span>
                                    );
                                })()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {leagues.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No leagues yet</p>
                    <p className="text-sm mt-2">Create your first league to get started</p>
                </div>
            )}
        </div>
    );
};

export default LeaguesList;
