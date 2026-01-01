import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms of service for using Sunroof.',
  openGraph: {
    title: 'Terms of Service | Sunroof',
    description: 'Read the terms of service for using Sunroof.',
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

