import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

export const metadata = {
    title: {
        template: '%s | Netlify',
        default: 'Netlify Starter'
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.svg" sizes="any" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Roboto+Flex:opsz,wght@8..144,100..1000&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap"
                    rel="stylesheet"
                />
            </head>

            <body className="antialiased bg-carbon">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    forcedTheme="dark"
                >
                    <div className="flex flex-col min-h-screen px-0 md:px-6 pb-0 md:pb-24">
                        <Providers>
                            <div className="grow fixed z-10 h-screen w-full md:w-[calc(100%-70px)] ml-0 md:ml-12 bg-carbon overflow-auto px-4 md:px-10 pt-14 md:pt-0 md:rounded-3xl pb-24">
                                {children}
                            </div>
                            <Toaster />
                        </Providers>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
