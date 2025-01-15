import '../styles/globals.css';
import { Provider } from '@/components/ui/provider';
import Header from '@/components/header';
import { ReduxProvider } from '@/components/redux-provider';
import { Toaster } from '@/components/ui/toaster';
import { Theme } from '@chakra-ui/react';

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
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap"
                    rel="stylesheet"
                />
            </head>

            <body
                className="antialiased text-white"
                style={{
                    fontFamily: 'Roboto Condensed, sans-serif',
                    background: `linear-gradient(169deg, rgba(214,238,251,1) 0%, rgba(224,239,236,1) 40%, rgba(229,239,231,1) 100%)`
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '100vh',
                        paddingLeft: '1.5rem', // equivalent to px-6
                        paddingRight: '1.5rem', // equivalent to px-6
                        paddingBottom: '100px'
                        // backgroundImage:
                        //     'linear-gradient(to bottom, rgb(10 10 10 / 0%), rgb(10 10 10 / 100%)), url(/images/noise.png)'
                    }}
                >
                    <div className="flex flex-col w-full max-w-5xl mx-auto grow">
                        <Provider enableColorScheme="light">
                            <Theme appearance="light">
                                <ReduxProvider>
                                    <div
                                        style={{
                                            paddingLeft: '40px',
                                            paddingRight: '40px',
                                            borderRadius: '20px',
                                            paddingBottom: '100px',
                                            position: 'fixed',
                                            zIndex: 10,
                                            height: '100vh',
                                            width: 'calc(100% - 70px)', // 100%',
                                            marginLeft: '50px',
                                            background: `linear-gradient(169deg, rgba(214,238,251,1) 0%, rgba(224,239,236,1) 40%, rgba(229,239,231,1) 100%)`,
                                            overflow: 'scroll'
                                        }}
                                        className="grow"
                                    >
                                        {children}
                                    </div>
                                    <Toaster />
                                </ReduxProvider>
                            </Theme>
                        </Provider>
                    </div>
                </div>
            </body>
        </html>
    );
}
