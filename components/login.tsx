import { login, signup } from '@/app/login/actions';
import { Box, Heading, Stack, Input, Button, Fieldset } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';

import { useForm } from 'react-hook-form';

export function LoginComponent({ toggleComponent }) {
    const { handleSubmit, control } = useForm<{ email: string; password: string }>();

    const onSubmit = async (data: { email: string; password: string }) => {
        await login(data);
    };

    return (
        <Box maxW="md" mx="auto" mt={10} p={5} borderWidth={1} borderRadius="lg">
            <Heading as="h2" size="lg" textAlign="center" mb={5}>
                Login
            </Heading>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack gap={4}>
                    <Field id="email" label="Email">
                        <Input type="email" placeholder="Enter your email" {...control.register('email')} />
                    </Field>
                    <Field id="password" label="Password">
                        <Input type="password" placeholder="Enter your password" {...control.register('password')} />
                    </Field>
                    <Button variant="solid" type="submit">
                        Login
                    </Button>
                    <Button variant="plain" onClick={toggleComponent}>
                        Register
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}

export function RegisterComponent({ toggleComponent }) {
    const { handleSubmit, register } = useForm<{ email: string; password: string }>();

    return (
        <Box maxW="md" mx="auto" mt={10} p={5} borderWidth={1} borderRadius="lg">
            <form onSubmit={handleSubmit((data) => signup(data))}>
                <Fieldset.Root>
                    <Fieldset.Legend as="h2" textAlign="center" mb={5}>
                        Register
                    </Fieldset.Legend>
                    <Fieldset.Content>
                        <Field id="email" label="Email">
                            <Input type="email" placeholder="Enter your email" {...register('email')} />
                        </Field>
                        <Field id="password" label="Password">
                            <Input type="password" placeholder="Enter your password" {...register('password')} />
                        </Field>
                        <Button variant="solid" type="submit">
                            Register
                        </Button>
                        <Button variant="plain" onClick={toggleComponent}>
                            Login
                        </Button>
                    </Fieldset.Content>
                </Fieldset.Root>
            </form>
        </Box>
    );
}
