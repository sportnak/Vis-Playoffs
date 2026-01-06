import { useForm } from 'react-hook-form';
import { inviteMember, removeMember, resetPools } from '@/actions/league';
import { Member } from '@/app/types';
import { toast } from '@/components/ui/toaster';
import { useLeagues, useUser } from '@/app/hooks';
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
import { useLeaguePageData } from '@/hooks/use-league-data';
import { useLeagueStore } from '@/stores/league-store';

export default function MembersTable({ leagueId }: { leagueId: string }) {
    const { handleSubmit, control } = useForm<{ email: string }>();
    const { league } = useLeaguePageData(leagueId as string);
    const { currentLeague } = useLeagueStore();
    const { user } = useUser();
    const [dialogOpen, setDialogOpen] = useState(false);

    const onSubmit = async (data: { email: string }) => {
        const res = await inviteMember({ email: data.email, league_id: leagueId });
        if (res.error) {
            toast.error((res as any).statusText === 'Conflict' ? 'Member Already Exists' : 'Error', {
            });
            return;
        }
        await resetPools(leagueId);
        toast.success('Member Invited');
        setDialogOpen(false);
        league.refetch()
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
            league.refetch()
        },
        [leagueId,]
    );

    return (
        <div className="overflow-x-auto">
            <div className="mb-4 flex justify-end w-full">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <DialogHeader>
                                <DialogTitle>Invite Member</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <P className="text-cool-gray">If Pools have already been created - they will be deleted and reset.</P>
                                <Input type="email" placeholder="Enter email" {...control.register('email')} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Invite</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Table className="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentLeague.league_members?.map((member, index) => (
                        <TableRow key={index}>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.status}</TableCell>
                            <TableCell>
                                {member.email !== user?.email && (
                                    <Button variant="ghost" onClick={() => handleRemoveMember(member)}>
                                        Remove
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
