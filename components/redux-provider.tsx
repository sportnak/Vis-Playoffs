'use client';
import { Provider as ReactReduxProvider } from 'react-redux';
import store from '@/store';
import Header from './header';
import { useUser } from '@/app/hooks';

export function ReduxProvider({ children }) {
    const { user } = useUser();
    return (
        <ReactReduxProvider store={store}>
            <Header />
            {children}
        </ReactReduxProvider>
    );
}
