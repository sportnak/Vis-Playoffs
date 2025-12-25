import { login, signup } from '@/app/login/actions';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';

import { useForm } from 'react-hook-form';
import { useCallback, useState } from 'react';

export function LoginComponent({ toggleComponent }) {
    const { handleSubmit, register } = useForm<{ email: string; password: string }>();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: { email: string; password: string }) => {
        setIsLoading(true);
        const result = await login(data);
        setIsLoading(false);
        if (result?.error) {
            toast.error('Invalid login. Make sure you confirmed your email.');
            return;
        }
        toast.success('Login successful');
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-5 bg-steel shadow-md rounded-lg border border-ui-border">
            <h2 className="text-2xl text-center mb-5 text-frost">
                Login
            </h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-4">
                    <Field id="email" label="Email">
                        <Input type="email" placeholder="Enter your email" {...register('email')} />
                    </Field>
                    <Field id="password" label="Password">
                        <Input type="password" placeholder="Enter your password" {...register('password')} />
                    </Field>
                    <Button variant="solid" type="submit" loading={isLoading}>
                        Login
                    </Button>
                    <Button variant="plain" onClick={isLoading ? undefined : toggleComponent} disabled={isLoading}>
                        Register
                    </Button>
                </div>
            </form>
        </div>
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
            toast.error(result.error.message);
            return;
        }
        toast.success('Register successful.', {
            description: 'Please check your email to verify your account.'
        });
    }, []);

    return (
        <div className="bg-steel shadow-md max-w-md mx-auto mt-10 p-5 rounded-lg border border-ui-border">
            <form onSubmit={handleSubmit(handleRegister)}>
                <fieldset className="flex flex-col gap-4">
                    <legend className="text-2xl text-center mb-5 text-frost">
                        Register
                    </legend>
                    <Field id="name" label="Name">
                        <Input type="text" placeholder="Enter your name" />
                    </Field>
                    <Field id="email" label="Email">
                        <Input type="email" placeholder="Enter your email" {...register('email')} />
                    </Field>
                    <Field id="password" label="Password">
                        <Input type="password" placeholder="Enter your password" {...register('password')} />
                    </Field>
                    <Button variant="solid" type="submit" loading={isLoading}>
                        Register
                    </Button>
                    <Button variant="plain" onClick={isLoading ? undefined : toggleComponent} disabled={isLoading}>
                        Login
                    </Button>
                </fieldset>
            </form>
        </div>
    );
}
