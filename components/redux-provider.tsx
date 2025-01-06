'use client';
import { Provider as ReactReduxProvider } from 'react-redux';
import store from '@/store';
import Header from './header';

export function ReduxProvider({ children }) {
    return (
        <ReactReduxProvider store={store}>
            <Header />
            {children}
        </ReactReduxProvider>
    );
}
