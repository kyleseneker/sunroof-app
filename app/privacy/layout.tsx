import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Sunroof protects your privacy and handles your data.',
  openGraph: {
    title: 'Privacy Policy | Sunroof',
    description: 'Learn how Sunroof protects your privacy and handles your data.',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

