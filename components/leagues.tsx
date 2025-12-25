'use client';
import { useLeagues } from '@/app/hooks';
import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CreateLeagueDialog from './create-league-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { H2 } from './ui/text';

const LeaguesList = () => {
    const { leagues } = useLeagues();

    const router = useRouter();
    const setActiveLeague = useCallback((id: number) => {
        router.push(`/leagues/${id}`);
    }, []);

    if (leagues == null) {
        return (
            <div className="max-w-[1000px] mx-auto p-5 flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[1000px] mx-auto p-5">
            <div className="flex justify-between items-center pb-5">
                <H2>Your Leagues</H2>
                <CreateLeagueDialog />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leagues.map((league) => (
                        <TableRow
                            className="cursor-pointer"
                            key={league.id}
                            onClick={() => setActiveLeague(league.id)}
                        >
                            <TableCell>{league.id}</TableCell>
                            <TableCell>{league.name}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default LeaguesList;
