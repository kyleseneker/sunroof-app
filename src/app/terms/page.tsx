import Link from 'next/link';
import { ChevronLeft, FileText, Shield, Users, AlertTriangle, Scale, RefreshCw, Mail } from 'lucide-react';

const textStyle = { fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '22px' };

export default function TermsOfService() {
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
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 
              className="text-white mb-1"
              style={{ fontSize: '24px', fontWeight: 700 }}
            >
              Terms of Service
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
            <Section icon={<Shield size={18} />} title="Acceptance of Terms">
              <p style={textStyle}>
                By accessing or using Sunroof, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the app.
              </p>
            </Section>

            <Section icon={<FileText size={18} />} title="Description of Service">
              <p className="mb-2" style={textStyle}>
                Sunroof is a time capsule app for capturing memories during journeys. You can capture 
                photos, videos, audio memos, and text notes—all of which remain locked until your 
                chosen unlock date. Features include:
              </p>
              <SimpleBullet text="Photo and video capture with location and weather context" />
              <SimpleBullet text="Audio recordings up to 5 minutes" />
              <SimpleBullet text="Text notes with your thoughts and reflections" />
              <SimpleBullet text="Collaborative journeys shared with others" />
              <SimpleBullet text="AI-powered journey recaps (using only text notes, never photos or audio)" />
              <SimpleBullet text="Offline capture with automatic background sync" />
            </Section>

            <Section icon={<Users size={18} />} title="User Content">
              <SimpleBullet text="You retain all rights to the photos, videos, audio, and notes you create" />
              <SimpleBullet text="You are responsible for all content you capture and upload" />
              <SimpleBullet text="Do not upload content that violates any laws or third-party rights" />
              <SimpleBullet text="Content shared in collaborative journeys is visible to all collaborators after unlock" />
            </Section>

            <Section icon={<AlertTriangle size={18} />} title="Acceptable Use">
              <p className="mb-2" style={textStyle}>You agree not to:</p>
              <SimpleBullet text="Use the service for any illegal purpose" />
              <SimpleBullet text="Upload harmful, offensive, or inappropriate content" />
              <SimpleBullet text="Attempt to access other users' locked memories" />
              <SimpleBullet text="Circumvent the time-lock mechanism" />
              <SimpleBullet text="Interfere with the proper functioning of the service" />
            </Section>

            <Section icon={<Scale size={18} />} title="Disclaimer & Liability">
              <p style={textStyle}>
                The service is provided &quot;as is&quot; without warranties of any kind. While we strive to 
                keep your memories safe, we do not guarantee that the service will be uninterrupted, 
                secure, or error-free. We recommend keeping copies of important memories. To the 
                maximum extent permitted by law, we shall not be liable for any loss of data or 
                indirect damages.
              </p>
            </Section>

            <Section icon={<RefreshCw size={18} />} title="Changes to Terms">
              <p style={textStyle}>
                We reserve the right to modify these terms at any time. We will notify you of 
                significant changes through the app. Continued use of the service after changes 
                constitutes acceptance of the new terms.
              </p>
            </Section>

            <Section icon={<Mail size={18} />} title="Contact" isLast>
              <p style={textStyle}>
                For questions about these Terms, contact us at{' '}
                <a 
                  href="mailto:hello@getsunroof.com" 
                  style={{ color: '#f97316', fontWeight: 500 }}
                  className="hover:underline"
                >
                  hello@getsunroof.com
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
