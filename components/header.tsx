'use client';
import Link from 'next/link';
import { Box, Button, Icon, Separator, Theme, VStack } from '@chakra-ui/react';
import { createClient } from '@/utils/supabase/client';
import { GrHomeRounded } from 'react-icons/gr';
import { HiOutlineLogout } from 'react-icons/hi';
import { useLeagues } from '@/app/hooks';
import { Tooltip } from './ui/tooltip';
import { useParams } from 'next/navigation';

export default function Header() {
    const handleSignOut = async () => {
        // Logic for signing out the user
        const client = await createClient();
        await client.auth.signOut();
        window.location.href = '/login';
    };

    const { leagues } = useLeagues();
    const { league_id } = useParams();

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
