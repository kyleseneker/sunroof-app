import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Eye, Database, Lock, UserCheck, Mail, Cpu, MapPin } from 'lucide-react';

const textStyle = { fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '22px' };

export default function PrivacyPolicy() {
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
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 
              className="text-white mb-1"
              style={{ fontSize: '24px', fontWeight: 700 }}
            >
              Privacy Policy
            </h1>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Last updated: January 10, 2026
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
            <Section icon={<Eye size={18} />} title="Overview">
              <p style={textStyle}>
                Sunroof is committed to protecting your privacy. This Privacy Policy explains how 
                we collect, use, and safeguard your information when you use our mobile application.
              </p>
            </Section>

            <Section icon={<Database size={18} />} title="Information We Collect">
              <BulletPoint label="Photos & Videos" text="Media you capture is stored securely until your chosen unlock date." />
              <BulletPoint label="Audio Memos" text="Voice recordings you create (up to 5 minutes each)." />
              <BulletPoint label="Text Notes" text="Written notes and reflections you add to your journeys." />
              <BulletPoint label="Journey Data" text="Journey names, destinations, emojis, unlock dates, and cover images." />
              <BulletPoint label="Account Info" text="Email address and profile data from Google OAuth or email sign-in." />
            </Section>

            <Section icon={<MapPin size={18} />} title="Location & Weather">
              <p className="mb-2" style={textStyle}>
                With your permission, we capture location and weather data with each memory to 
                enrich your journey experience. This data is:
              </p>
              <SimpleBullet text="Only collected when you actively capture a memory" />
              <SimpleBullet text="Stored with your memory and locked until the unlock date" />
              <SimpleBullet text="Never shared with third parties for advertising" />
              <SimpleBullet text="Controllable via your device settings and in-app preferences" />
            </Section>

            <Section icon={<Cpu size={18} />} title="AI Features">
              <p className="mb-2" style={textStyle}>
                Our AI Recap feature generates journey summaries. Here&apos;s how we protect your privacy:
              </p>
              <SimpleBullet text="Only text notes are sent to AI—never photos, videos, or audio" />
              <SimpleBullet text="AI processing is done via OpenAI's API" />
              <SimpleBullet text="Recaps are saved to your account and can be deleted anytime" />
              <SimpleBullet text="You choose when to generate a recap—it's never automatic" />
            </Section>

            <Section icon={<Lock size={18} />} title="Data Storage & Security">
              <p className="mb-2" style={textStyle}>
                Your memories are stored securely using industry-standard practices:
              </p>
              <SimpleBullet text="Backend powered by Supabase with SOC 2 Type II compliance" />
              <SimpleBullet text="Authentication tokens stored in secure device keychain" />
              <SimpleBullet text="Media files stored in encrypted cloud storage" />
              <SimpleBullet text="Offline captures are stored locally until synced" />
            </Section>

            <Section icon={<UserCheck size={18} />} title="Your Rights">
              <SimpleBullet text="Access all your personal data through the app" />
              <SimpleBullet text="Delete your account and all associated data" />
              <SimpleBullet text="Export your unlocked memories" />
              <SimpleBullet text="Control location and weather capture in settings" />
              <SimpleBullet text="Opt out of AI features entirely" />
            </Section>

            <Section icon={<Mail size={18} />} title="Contact Us" isLast>
              <p style={textStyle}>
                If you have questions about this Privacy Policy or want to exercise your data rights, 
                please contact us at{' '}
                <a 
                  href="mailto:privacy@getsunroof.com" 
                  style={{ color: '#f97316', fontWeight: 500 }}
                  className="hover:underline"
                >
                  privacy@getsunroof.com
                </a>
              </p>
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

function SimpleBullet({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 mb-2">
      <div 
        className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
        style={{ background: '#f97316' }}
      />
      <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '22px' }}>
        {text}
      </p>
    </div>
  );
}
