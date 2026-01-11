import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Sunroof | Capture now, relive later',
    template: '%s | Sunroof',
  },
  description: 'The delayed camera. Take photos and notes during your journey. Unlock them when you\'re ready to remember.',
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
  viewportFit: 'cover',
  themeColor: '#451a03',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      </head>
      <body 
        className="antialiased overflow-x-hidden selection:bg-orange-500/30 selection:text-white"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {/* Background image - Rolling hills at sunset by Sohan Shingade on Unsplash */}
        <div className="fixed inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/background"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay matching RN app: top dark, middle clear, bottom darker */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
        </div>
        
        {/* Film grain texture */}
        <div className="grain-overlay" aria-hidden="true" />
        
        {/* Content */}
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
