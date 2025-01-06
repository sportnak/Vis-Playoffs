'use client';
import { useCallback, useState } from 'react';
import { LoginComponent, RegisterComponent } from '@/components/login';

export default function LoginPage() {
    const [isLoggingIn, setIsLoggingIn] = useState(true);

    const toggleComponent = useCallback(() => {
        setIsLoggingIn((x) => !x);
    }, []);

    if (isLoggingIn) {
        return <LoginComponent toggleComponent={toggleComponent} />;
    } else {
        return <RegisterComponent toggleComponent={toggleComponent} />;
    }
}
