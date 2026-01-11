import Link from 'next/link';
import { ChevronLeft, LifeBuoy, HelpCircle, Mail, Bug, Smartphone } from 'lucide-react';

const textStyle = { fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '22px' };

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-y-auto scrollbar-hide">
      {/* Header */}
      <header className="p-4">
        <Link 
          href="/"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-white/10"
          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          aria-label="Back to home"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Hero - matching RN Hero component */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div 
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #fb923c)',
                  boxShadow: '0 8px 16px rgba(249, 115, 22, 0.4)',
                }}
              >
                <LifeBuoy className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 
              className="text-white mb-1"
              style={{ fontSize: '24px', fontWeight: 700 }}
            >
              Support
            </h1>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
              We&apos;re here to help
            </p>
          </div>

          {/* Sections card */}
          <div 
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Section icon={<Mail size={18} />} title="Contact Us">
              <p className="mb-4" style={textStyle}>
                Have a question, found a bug, or need help with your account? We&apos;d love to hear from you.
              </p>
              <a 
                href="mailto:support@getsunroof.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all hover:scale-105 active:scale-95"
                style={{ 
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white',
                }}
              >
                <Mail size={16} />
                support@getsunroof.com
              </a>
            </Section>

            <Section icon={<HelpCircle size={18} />} title="Frequently Asked Questions">
              <BulletPoint label="How do I create a journey?" text="Tap the + button on the home screen, give your journey a name, pick an unlock date, and start capturing memories!" />
              <BulletPoint label="Can I see my memories before the unlock date?" text="No — that's the magic! Your memories stay locked until the date you set. This helps you stay present and makes the reveal more exciting." />
              <BulletPoint label="What happens if I delete the app?" text="Your memories are stored securely in the cloud. Reinstall the app and sign in with the same account to access them." />
              <BulletPoint label="Can I invite others to my journey?" text="Yes! Tap on a journey, then 'Add Collaborator' to invite friends via email. They can add their own memories to your shared journey." />
              <BulletPoint label="How does the AI Recap work?" text="After your journey unlocks, you can generate an AI-powered summary of your experience. It uses only your text notes — never your photos or audio." />
            </Section>

            <Section icon={<Bug size={18} />} title="Troubleshooting">
              <BulletPoint label="My memories aren't syncing" text="Check your internet connection and try pulling down to refresh. Memories captured offline will sync automatically when you're back online." />
              <BulletPoint label="Camera or microphone not working" text="Go to Settings → Sunroof and make sure Camera and Microphone permissions are enabled." />
              <BulletPoint label="I'm not receiving notifications" text="Check Settings → Sunroof → Notifications and make sure they're enabled. Also check your in-app notification settings." />
              <BulletPoint label="I forgot which email I used to sign up" text="Try signing in with Google or use the magic link option with different email addresses you might have used." />
            </Section>

            <Section icon={<Smartphone size={18} />} title="Resources" isLast>
              <div className="flex flex-col gap-3">
                <ResourceLink href="/help" label="How Sunroof Works" />
                <ResourceLink href="/privacy" label="Privacy Policy" />
                <ResourceLink href="/terms" label="Terms of Service" />
              </div>
            </Section>
          </div>
          
          {/* Footer */}
          <footer className="mt-8 text-center">
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              © {new Date().getFullYear()} Kyle Seneker. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function Section({ 
  icon, 
  title, 
  children, 
  isLast = false 
}: { 
  icon: React.ReactNode; 
  title: string; 
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div 
      className="p-6"
      style={{ 
        borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.08)' 
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2))',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            color: '#f97316',
          }}
        >
          {icon}
        </div>
        <h2 
          className="flex-1 text-white"
          style={{ fontSize: '16px', fontWeight: 600 }}
        >
          {title}
        </h2>
      </div>
      <div className="pl-12">
        {children}
      </div>
    </div>
  );
}

function BulletPoint({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-start gap-2 mb-2">
      <div 
        className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
        style={{ background: '#f97316' }}
      />
      <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '22px' }}>
        <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>{label}: </span>
        {text}
      </p>
    </div>
  );
}

function ResourceLink({ href, label }: { href: string; label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-white/5"
      style={{ 
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>{label}</span>
      <ChevronLeft className="w-4 h-4 ml-auto rotate-180" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
    </Link>
  );
}
