'use client';
import Link from 'next/link';
import { Button } from '@chakra-ui/react';

export default function Header() {
    const handleSignOut = () => {
        // Logic for signing out the user
        console.log('User signed out');
    };

    return (
        <header
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: '#d0d0d0', // Darkened background
                width: '100%',
                position: 'fixed',
                left: 0,
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
        >
            <Link href="/" style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                Home
            </Link>
            <Button onClick={handleSignOut} style={{ backgroundColor: 'red', color: 'white' }}>
                Sign Out
            </Button>
        </header>
    );
}
