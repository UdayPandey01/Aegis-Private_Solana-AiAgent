import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Syncopate, Share_Tech_Mono } from 'next/font/google';
import { SolanaProvider } from '@/components/WalletContextProvider';

const syncopate = Syncopate({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-syncopate',
  display: 'swap',
});

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-share-tech-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aegis - Autonomous Trading, Fortified',
  description: 'Private, autonomous Solana agents powered by zero-knowledge proofs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${syncopate.variable} ${shareTechMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SolanaProvider>
            {children}
          </SolanaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}