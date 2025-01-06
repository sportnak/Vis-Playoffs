import { Box, Button, Input, Table } from '@chakra-ui/react';
import {
    DialogRoot,
    DialogActionTrigger,
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from './ui/dialog';
import { useForm } from 'react-hook-form';
import { inviteMember } from '@/actions/league';
import { Member } from '@/app/types';
import { Toaster, toaster } from '@/components/ui/toaster';
import { useAppDispatch } from '@/app/hooks';
import { setMembers } from '@/store/leagueSlice';

export default function MembersTable({ league_id, members }: { league_id: number; members: Member[] }) {
    const { handleSubmit, control } = useForm<{ email: string }>();
    const dispatch = useAppDispatch();
    const onSubmit = async (data: { email: string }) => {
        const res = await inviteMember({ email: data.email, league_id });
        if (res.error) {
            toaster.create({
                title: res.statusText === 'Conflict' ? 'Member Already Exists' : 'Error',
                type: 'error'
            });
            return;
        }
        toaster.create({
            title: 'Member Invited',
            type: 'success'
        });
        dispatch(setMembers(null));
    };

    return (
        <Box overflowX="auto">
            <Box mb={4} display="flex" justifyContent={'flex-end'} w="100%">
                <DialogRoot size={'md'} placement={'center'}>
                    <DialogTrigger>
                        <Button as="div" variant="outline">
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <DialogHeader>
                                <DialogTitle>Invite Member</DialogTitle>
                            </DialogHeader>
                            <DialogBody>
                                <Input type="email" placeholder="Enter email" {...control.register('email')} />
                            </DialogBody>
                            <DialogFooter>
                                <DialogActionTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogActionTrigger>
                                <DialogActionTrigger asChild>
                                    <Button type="submit">Invite</Button>
                                </DialogActionTrigger>
                            </DialogFooter>
                            <DialogCloseTrigger />
                        </form>
                    </DialogContent>
                </DialogRoot>
            </Box>
            <Table.Root width="100%">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Email</Table.ColumnHeader>
                        <Table.ColumnHeader>Status</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {members?.map((member, index) => (
                        <Table.Row key={index}>
                            <Table.Cell>{member.email}</Table.Cell>
                            <Table.Cell>{member.status}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}
