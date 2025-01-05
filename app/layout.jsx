import '../styles/globals.css';
import { Provider } from '@/components/ui/provider';

export const metadata = {
    title: {
        template: '%s | Netlify',
        default: 'Netlify Starter'
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" data-theme="lofi">
            <head>
                <link rel="icon" href="/favicon.svg" sizes="any" />
            </head>
            <body
                className="antialiased text-white"
                style={{
                    background: 'linear-gradient(to bottom, rgb(30 58 138 / var(--tw-bg-opacity, 1)), black)'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '100vh',
                        paddingLeft: '1.5rem', // equivalent to px-6
                        paddingRight: '1.5rem', // equivalent to px-6
                        backgroundImage:
                            'linear-gradient(to bottom, rgb(10 10 10 / 0%), rgb(10 10 10 / 100%)), url(/images/noise.png)'
                    }}
                >
                    <div className="flex flex-col w-full max-w-5xl mx-auto grow">
                        <Provider>
                            <div className="grow">{children}</div>
                        </Provider>
                    </div>
                </div>
            </body>
        </html>
    );
}
