import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ToastProvider, SkipLink } from '@/components/ui';
import { OfflineIndicator, InstallPrompt, ErrorBoundary } from '@/components/features';
import { AuthProvider, ThemeProvider } from '@/providers';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space',
});

export const metadata: Metadata = {
  title: {
    default: 'Sunroof | Capture now, relive later',
    template: '%s | Sunroof',
  },
  description: 'The delayed camera. Take photos and notes during your journey. Unlock them when you\'re ready to remember.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://getsunroof.com'),
  keywords: ['photo journal', 'travel memories', 'time capsule', 'delayed camera', 'trip journal', 'memory app'],
  authors: [{ name: 'Sunroof' }],
  creator: 'Sunroof',
  publisher: 'Sunroof',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'Sunroof | Capture now, relive later',
    description: 'The delayed camera. Your memories unlock when you\'re ready to remember.',
    url: 'https://getsunroof.com',
    siteName: 'Sunroof',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sunroof - The delayed camera',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sunroof | Capture now, relive later',
    description: 'The delayed camera. Your memories unlock when you\'re ready to remember.',
    images: ['/og-image.png'],
    creator: '@getsunroof',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sunroof',
  },
  category: 'lifestyle',
  classification: 'Travel & Photography',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="font-sans antialiased bg-[var(--bg-base)] text-[var(--fg-base)] overflow-hidden selection:bg-[var(--color-accent)]/30 selection:text-[var(--fg-base)]">
        {/* Skip Link for Accessibility */}
        <SkipLink />
        
        <ErrorBoundary>
          <ThemeProvider defaultTheme="dark">
            <AuthProvider>
              <ToastProvider>
                {/* Offline Indicator */}
                <OfflineIndicator />
                
                {/* Install Prompt for PWA */}
                <InstallPrompt />
                
                {/* Ambient Aurora Glow */}
                <div className="aurora-bg" aria-hidden="true" />
                
                {/* Film Grain Texture */}
                <div className="grain-overlay" aria-hidden="true" />
                
                {/* Content */}
                <main id="main-content" className="relative z-[var(--z-elevated)]" role="main">
                  {children}
                </main>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
