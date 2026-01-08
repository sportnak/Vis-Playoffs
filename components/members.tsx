'use client';

import { useForm } from 'react-hook-form';
import { inviteMember, removeMember, resetPools, updateMemberRole } from '@/actions/league';
import { Member } from '@/app/types';
import { toast } from '@/components/ui/toaster';
import { useUser } from '@/app/hooks';
import { useCallback, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose
} from './ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { P } from './ui/text';
import { useLeagueStore } from '@/stores/league-store';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export default function MembersTable({ leagueId }: { leagueId: string }) {
    const { handleSubmit, control } = useForm<{ email: string }>();
    const queryClient = useQueryClient();
    const { currentLeague } = useLeagueStore();
    const { user } = useUser();
    const [dialogOpen, setDialogOpen] = useState(false);

    const onSubmit = async (data: { email: string }) => {
        const res = await inviteMember({ email: data.email, league_id: leagueId });
        if (res.error) {
            toast.error((res as any).statusText === 'Conflict' ? 'Member Already Exists' : 'Error');
            return;
        }
        await resetPools(leagueId);
        toast.success('Member Invited');
        setDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['league', leagueId] });
    };

    const handleRemoveMember = useCallback(
        async (member: Member) => {
            const res = await removeMember({ email: member.email, league_id: leagueId });
            if (res.error) {
                toast.error('Failed to remove member');
                return;
            }
            await resetPools(leagueId);
            toast.success('Member Removed');
            queryClient.invalidateQueries({ queryKey: ['league', leagueId] });
        },
        [leagueId, queryClient]
    );

    const handleRoleChange = useCallback(
        async (member: Member, newRole: 'admin' | 'member') => {
            if (!member.user_id) {
                toast.error('Cannot change role - member has not accepted invite');
                return;
            }

            const res = await updateMemberRole({
                league_id: leagueId,
                member_user_id: member.user_id,
                role: newRole
            });

            if (res.error) {
                toast.error(res.error.message);
                return;
            }

            toast.success(newRole === 'admin' ? 'Member promoted to admin' : 'Member role updated');
            queryClient.invalidateQueries({ queryKey: ['league', leagueId] });
        },
        [leagueId, queryClient]
    );

    const getMemberRole = (member: Member) => {
        return member.role || 'member';
    };

    return (
        <div className="w-full mx-auto">
            <div className="bg-steel border border-ui-border shadow-md rounded-md">
                <div className="py-2 px-4 border-b border-ui-border flex justify-between items-center">
                    <P className="font-light font-roboto-mono tracking-[0.025rem] text-sm">MEMBERS</P>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" size="sm" className="font-roboto-mono tracking-button">
                                INVITE MEMBER
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="p-0">
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <DialogHeader className="px-4 py-4 border-b border-ui-border">
                                    <DialogTitle className="tracking-mono text-sm">INVITE MEMBER</DialogTitle>
                                </DialogHeader>
                                <div className="px-4 py-4 space-y-4 border-b border-ui-border">
                                    <P className="text-cool-gray text-sm">
                                        If pools have already been created, they will be deleted and reset.
                                    </P>
                                    <Input
                                        type="email"
                                        placeholder="Enter email address"
                                        {...control.register('email', { required: true })}
                                    />
                                </div>
                                <DialogFooter className="pb-4 px-4">
                                    <DialogClose asChild>
                                        <Button variant="outline" className="font-roboto-mono tracking-button" size="sm">
                                            CANCEL
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        variant="default"
                                        className="font-roboto-mono tracking-button"
                                        size="sm"
                                    >
                                        INVITE
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">EMAIL</TableHead>
                                <TableHead>STATUS</TableHead>
                                <TableHead>ROLE</TableHead>
                                <TableHead className="text-right">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentLeague?.league_members?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-cool-gray">
                                        No members yet
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentLeague?.league_members?.map((member, index) => {
                                    const role = getMemberRole(member);
                                    const isCurrentUser = member.email === user?.email;

                                    return (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">
                                                {member.email}
                                                {isCurrentUser && (
                                                    <span className="ml-2 text-xs text-frost">(You)</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`text-xs tracking-mono uppercase ${
                                                        member.status === 'active'
                                                            ? 'text-green-500'
                                                            : 'text-yellow-500'
                                                    }`}
                                                >
                                                    {member.status || 'pending'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {member.user_id ? (
                                                    <Select
                                                        value={role}
                                                        onValueChange={(value) =>
                                                            handleRoleChange(member, value as 'admin' | 'member')
                                                        }
                                                        disabled={isCurrentUser}
                                                    >
                                                        <SelectTrigger className="w-[120px] h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="member">Member</SelectItem>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-xs text-cool-gray tracking-mono">
                                                        Pending
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!isCurrentUser && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveMember(member)}
                                                        className="font-roboto-mono tracking-button"
                                                    >
                                                        REMOVE
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
