'use client';
import { Provider as ReactReduxProvider } from 'react-redux';
import { useUser } from '@/app/hooks';
import store from '@/store';

export function ReduxProvider({ children }) {
    return <ReactReduxProvider store={store}>{children}</ReactReduxProvider>;
}
