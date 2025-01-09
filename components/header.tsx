'use client';
import Link from 'next/link';
import { Button } from '@chakra-ui/react';
import { createClient } from '@/utils/supabase/client';

export default function Header() {
    const handleSignOut = async () => {
        // Logic for signing out the user
        console.log('User signed out');
        const client = await createClient();
        await client.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <header
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: 'rgba(128, 128, 128, 0.5)', // Darkened background
                width: '100%',
                position: 'fixed',
                left: 0,
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                height: '50px'
            }}
        >
            <Link href="/">Home</Link>
            <Button onClick={handleSignOut} variant="ghost">
                Sign Out
            </Button>
        </header>
    );
}
