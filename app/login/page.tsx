import { Box, Button, Input, Stack, Heading } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';

export default function LoginPage() {
    return (
        <Box maxW="md" mx="auto" mt={10} p={5} borderWidth={1} borderRadius="lg">
            <Heading as="h2" size="lg" textAlign="center" mb={5}>
                Login
            </Heading>
            <Stack gap={4}>
                <Field id="email" label="Email">
                    <Input type="email" placeholder="Enter your email" />
                </Field>
                <Field id="password" label="Password">
                    <Input type="password" placeholder="Enter your password" />
                </Field>
                <Button colorScheme="teal" type="submit">
                    Login
                </Button>
            </Stack>
        </Box>
    );
}
