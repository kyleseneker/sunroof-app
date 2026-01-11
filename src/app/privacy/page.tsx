import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Eye, Database, Lock, UserCheck, Mail, Cpu, MapPin, Users, Share2, Globe, Clock, Bell } from 'lucide-react';

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
                Kyle Seneker (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Sunroof mobile 
                application (&quot;Service&quot;). This Privacy Policy describes how we collect, use, 
                disclose, and safeguard your personal information when you use our Service. 
                By accessing or using the Service, you consent to the collection and use of 
                your information in accordance with this Privacy Policy. If you do not agree 
                with our policies and practices, do not use the Service.
              </p>
            </Section>

            <Section icon={<Users size={18} />} title="Children&apos;s Privacy">
              <p style={textStyle}>
                Sunroof is not intended for children under 13 years of age. We do not knowingly 
                collect personal information from children under 13. If you are a parent or guardian 
                and believe your child has provided us with personal information, please contact us 
                at{' '}
                <a 
                  href="mailto:privacy@getsunroof.com" 
                  style={{ color: '#f97316', fontWeight: 500 }}
                  className="hover:underline"
                >
                  privacy@getsunroof.com
                </a>
                {' '}and we will promptly delete such information.
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

            <Section icon={<Bell size={18} />} title="Push Notifications">
              <p style={textStyle}>
                With your permission, we send push notifications to remind you when journeys unlock 
                and for daily capture reminders. We collect your device token to deliver these 
                notifications. You can disable notifications at any time in your device settings 
                or within the app.
              </p>
            </Section>

            <Section icon={<Share2 size={18} />} title="Third-Party Services">
              <p className="mb-2" style={textStyle}>
                We share data with the following third-party services to operate Sunroof:
              </p>
              <SimpleBullet text="Supabase (database, authentication, file storage) — stores your account and memory data" />
              <SimpleBullet text="Sentry (error tracking, performance monitoring) — receives crash reports, app performance data, and error logs to help us improve stability" />
              <SimpleBullet text="OpenAI (AI recaps) — receives only text notes, never photos or audio" />
              <SimpleBullet text="OpenWeather (weather data) — receives your location coordinates" />
              <SimpleBullet text="Unsplash (cover images) — receives search queries for destinations" />
              <p className="mt-2" style={textStyle}>
                We do not sell your personal information. We do not share your data with 
                advertisers or data brokers.
              </p>
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

            <Section icon={<Globe size={18} />} title="International Data Transfers">
              <p style={textStyle}>
                Your data may be transferred to and processed in countries other than your own, 
                including the United States where our servers and third-party service providers 
                are located. By using Sunroof, you consent to the transfer of your information 
                to these countries, which may have different data protection laws than your jurisdiction.
              </p>
            </Section>

            <Section icon={<Clock size={18} />} title="Data Retention">
              <p style={textStyle}>
                We retain your data for as long as your account is active. When you delete your 
                account, all your data including journeys, memories, and personal information 
                is permanently deleted within 30 days. Backup copies may persist for up to 90 days 
                before complete removal.
              </p>
            </Section>

            <Section icon={<UserCheck size={18} />} title="Your Rights">
              <SimpleBullet text="Access all your personal data through the app" />
              <SimpleBullet text="Delete your account and all associated data" />
              <SimpleBullet text="Export your unlocked memories" />
              <SimpleBullet text="Control location and weather capture in settings" />
              <SimpleBullet text="Opt out of AI features entirely" />
            </Section>

            <Section icon={<ShieldCheck size={18} />} title="California Privacy Rights">
              <p className="mb-2" style={textStyle}>
                If you are a California resident, you have additional rights under the California 
                Consumer Privacy Act (CCPA):
              </p>
              <SimpleBullet text="Right to know what personal information we collect and how it is used" />
              <SimpleBullet text="Right to delete your personal information" />
              <SimpleBullet text="Right to opt-out of the sale of personal information (we do not sell your data)" />
              <SimpleBullet text="Right to non-discrimination for exercising your privacy rights" />
              <p className="mt-2" style={textStyle}>
                To exercise these rights, contact us at{' '}
                <a 
                  href="mailto:privacy@getsunroof.com" 
                  style={{ color: '#f97316', fontWeight: 500 }}
                  className="hover:underline"
                >
                  privacy@getsunroof.com
                </a>
                . We will respond to verifiable consumer requests within 45 days.
              </p>
            </Section>

            <Section icon={<Clock size={18} />} title="Changes to This Policy">
              <p style={textStyle}>
                We may update this Privacy Policy from time to time. If we make material changes, 
                we will notify you by posting the updated policy within the Service and updating 
                the &quot;Last updated&quot; date above. We encourage you to review this Privacy Policy 
                periodically for any changes. Your continued use of the Service after the posting 
                of changes constitutes your acceptance of such changes.
              </p>
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
