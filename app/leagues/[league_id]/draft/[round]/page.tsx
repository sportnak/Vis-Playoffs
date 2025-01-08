'use client';
import { useLeague } from '@/app/hooks';
import { Box, Center, Heading, Tabs, Text } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import React from 'react';
import DraftTable from '@/components/draft-table';

const LeagueView = () => {
    const { league_id: leagueId, round: roundId } = useParams();
    const { league } = useLeague(leagueId.toString());

    if (!league) {
        return (
            <Center>
                <Text>Loading...</Text>
            </Center>
        );
    }

    const items = [
        {
            title: 'Draft',
            content: <DraftTable />
        },
        {
            title: 'Pool Teams',
            content: 'Dolore ex esse laboris elit magna esse sunt'
        }
    ];

    return (
        <Box maxW={'1000px'} mx={'auto'} p={5}>
            <Heading as="h2" size="lg" pb="20px">
                {league.name}
            </Heading>
            <Text fontSize="md">League ID: {league.id}</Text>

            <Tabs.Root defaultValue="Draft" width="full">
                <Tabs.List>
                    {items.map((item, index) => (
                        <Tabs.Trigger key={index} value={item.title}>
                            {item.title}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>
                <Box pos="relative" minH="200px" width="full">
                    {items.map((item, index) => (
                        <Tabs.Content
                            key={index}
                            value={item.title}
                            position="absolute"
                            inset="0"
                            _open={{
                                animationName: 'fade-in, scale-in',
                                animationDuration: '300ms'
                            }}
                            _closed={{
                                animationName: 'fade-out, scale-out',
                                animationDuration: '120ms'
                            }}
                        >
                            {item.content}
                        </Tabs.Content>
                    ))}
                </Box>
            </Tabs.Root>
        </Box>
    );
};

export default LeagueView;
