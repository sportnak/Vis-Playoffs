'use client';
import { League } from '@/app/types';
import { Box, Heading, Text } from '@chakra-ui/react';

export default function GeneralSettings({ league }: { league: League }) {
    return (
        <Box>
            <Heading mb="20px" fontWeight={100} ml={'10px'}>
                General Settings
            </Heading>
            <Box
                style={{ background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px' }}
                boxShadow="md"
                p={4}
            >
                <Text color="gray.600">
                    Additional league preferences will be available here in future updates.
                </Text>
            </Box>
        </Box>
    );
}
