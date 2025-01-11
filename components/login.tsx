import { login, signup } from '@/app/login/actions';
import { Box, Heading, Stack, Input, Button, Fieldset, Spinner } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';

import { useForm } from 'react-hook-form';
import { toaster } from './ui/toaster';
import { useCallback, useState } from 'react';

export function LoginComponent({ toggleComponent }) {
    const { handleSubmit, control } = useForm<{ email: string; password: string }>();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: { email: string; password: string }) => {
        setIsLoading(true);
        const result = await login(data);
        setIsLoading(false);
        if (result?.error) {
            toaster.create({
                type: 'error',
                title: 'Invalid login. Make sure you confirmed your email.'
            });
            return;
        }
        toaster.create({
            type: 'success',
            title: 'Login successful'
        });
    };

    return (
        <Box maxW="md" mx="auto" mt={10} p={5} background="rgba(255, 255, 255, 0.3)" boxShadow={'md'} borderRadius="lg">
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
                    <Button variant="solid" type="submit" disabled={isLoading}>
                        {isLoading ? <Spinner /> : 'Login'}
                    </Button>
                    <Button variant="plain" onClick={isLoading ? null : toggleComponent}>
                        Register
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}

export function RegisterComponent({ toggleComponent }) {
    const { handleSubmit, register } = useForm<{ email: string; password: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const handleRegister = useCallback(async (data) => {
        setIsLoading(true);
        const result = await signup(data);
        setIsLoading(false);

        if (result?.error) {
            toaster.create({
                type: 'error',
                title: result.error.message
            });
            return;
        }
        toaster.create({
            type: 'success',
            title: 'Register successful.',
            description: 'Please check your email to verify your account.'
        });
    }, []);

    return (
        <Box background="rgba(255, 255, 255, 0.3)" boxShadow={'md'} maxW="md" mx="auto" mt={10} p={5} borderRadius="lg">
            <form onSubmit={handleSubmit(handleRegister)}>
                <Fieldset.Root>
                    <Fieldset.Legend as="h2" textAlign="center" mb={5}>
                        Register
                    </Fieldset.Legend>
                    <Fieldset.Content>
                        <Field id="name" label="Name">
                            <Input type="name" placeholder="Enter your name" />
                        </Field>
                        <Field id="email" label="Email">
                            <Input type="email" placeholder="Enter your email" {...register('email')} />
                        </Field>
                        <Field id="password" label="Password">
                            <Input type="password" placeholder="Enter your password" {...register('password')} />
                        </Field>
                        <Button disabled={isLoading} variant="solid" type="submit">
                            {isLoading ? <Spinner /> : 'Register'}
                        </Button>
                        <Button variant="plain" onClick={isLoading ? null : toggleComponent}>
                            Login
                        </Button>
                    </Fieldset.Content>
                </Fieldset.Root>
            </form>
        </Box>
    );
}
