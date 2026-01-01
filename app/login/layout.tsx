import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Sunroof with your email. No password required.',
  openGraph: {
    title: 'Sign In | Sunroof',
    description: 'Sign in to Sunroof with your email. No password required.',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

