'use client';
import { useLeague, useUser } from '@/app/hooks';
import { Box, Button, Center, Heading, HStack, Text } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';

export default function League() {
    const { league_id } = useParams();
    const { league } = useLeague(league_id as string);
    const { user } = useUser();
    const router = useRouter();

    const isAdmin = user?.id === league?.admin_id;

    if (!league) {
        return (
            <Center>
                <Text>Loading...</Text>
            </Center>
        );
    }

    return (
        <Box maxW={'1000px'} mx={'auto'} p={5}>
            <HStack w="100%" justifyContent="space-between">
                <Heading as="h2" size="lg" pb="20px">
                    {league.name}
                </Heading>
                {isAdmin && (
                    <Button variant="solid" onClick={() => router.push(`/leagues/${league_id}/manage`)}>
                        Manage
                    </Button>
                )}
            </HStack>
        </Box>
    );
}
