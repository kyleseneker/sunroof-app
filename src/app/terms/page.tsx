import Link from 'next/link';
import { ChevronLeft, FileText, Shield, Users, AlertTriangle, Scale, RefreshCw, Mail, UserX, Globe, Sparkles, Gavel } from 'lucide-react';

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
                By downloading, accessing, or using the Sunroof mobile application (&quot;Service&quot;), 
                you (&quot;User&quot; or &quot;you&quot;) agree to be legally bound by these Terms of Service 
                (&quot;Terms&quot;) and our Privacy Policy, which is incorporated herein by reference. 
                These Terms constitute a binding legal agreement between you and Kyle Seneker 
                (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). If you do not agree to these Terms, 
                you must not access or use the Service.
              </p>
            </Section>

            <Section icon={<Users size={18} />} title="Eligibility">
              <p style={textStyle}>
                Sunroof is not directed to children under 13 years of age. By accessing or using 
                this Service, you represent and warrant that you are at least 13 years old. If we 
                learn that we have collected personal information from a child under 13, we will 
                take steps to delete that information as soon as possible.
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
              <p className="mb-2" style={textStyle}>
                You retain all ownership rights to the photos, videos, audio recordings, and text 
                notes (&quot;User Content&quot;) that you create using the Service. By uploading User Content, 
                you grant us a limited, non-exclusive, royalty-free license to store, process, and 
                display your User Content solely for the purpose of providing the Service to you.
              </p>
              <SimpleBullet text="You are solely responsible for all User Content you capture and upload" />
              <SimpleBullet text="You represent and warrant that your User Content does not violate any applicable laws or infringe upon the rights of any third party" />
              <SimpleBullet text="User Content shared in collaborative journeys will be visible to all designated collaborators after the unlock date" />
              <SimpleBullet text="We do not claim ownership of your User Content and will not use it for any purpose other than providing the Service" />
            </Section>

            <Section icon={<AlertTriangle size={18} />} title="Acceptable Use">
              <p className="mb-2" style={textStyle}>You agree not to:</p>
              <SimpleBullet text="Use the service for any illegal purpose" />
              <SimpleBullet text="Upload harmful, offensive, or inappropriate content" />
              <SimpleBullet text="Attempt to access other users' locked memories" />
              <SimpleBullet text="Circumvent the time-lock mechanism" />
              <SimpleBullet text="Interfere with the proper functioning of the service" />
            </Section>

            <Section icon={<Sparkles size={18} />} title="Third-Party Services">
              <p className="mb-2" style={textStyle}>
                Sunroof integrates with third-party services to provide its features:
              </p>
              <SimpleBullet text="Supabase for authentication, database, and file storage" />
              <SimpleBullet text="OpenAI for AI-powered journey recaps (text notes only)" />
              <SimpleBullet text="OpenWeather for weather data" />
              <SimpleBullet text="Unsplash for journey cover images" />
              <p className="mt-2" style={textStyle}>
                We are not responsible for the availability, accuracy, or practices of these 
                third-party services. Your use of these features is subject to the respective 
                third-party terms.
              </p>
            </Section>

            <Section icon={<Scale size={18} />} title="Disclaimer of Warranties">
              <p className="mb-4" style={textStyle}>
                THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT 
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND 
                NON-INFRINGEMENT.
              </p>
              <p className="mb-2" style={textStyle}>
                We do not warrant that the Service will be uninterrupted, secure, or error-free, 
                or that any defects will be corrected.
              </p>
              <p style={textStyle}>
                You acknowledge that you use the Service at your own risk. We strongly recommend 
                maintaining independent copies of any content that is important to you.
              </p>
            </Section>

            <Section icon={<Scale size={18} />} title="Limitation of Liability">
              <p className="mb-4" style={textStyle}>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL KYLE SENEKER 
                OR SUNROOF BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
                PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF PROFITS, 
                OR LOSS OF GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, 
                WHETHER BASED ON WARRANTY, CONTRACT, TORT, OR ANY OTHER LEGAL THEORY, EVEN IF 
                WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p style={textStyle}>
                Our total liability for any claims arising from these Terms or your use of the 
                Service shall not exceed the amount you paid us, if any, in the twelve (12) months 
                preceding the claim.
              </p>
            </Section>

            <Section icon={<UserX size={18} />} title="Account Termination">
              <p style={textStyle}>
                We reserve the right to suspend or terminate your account if you violate these 
                Terms or engage in conduct that we determine, in our sole discretion, to be 
                harmful to other users, us, or third parties. You may delete your account at 
                any time through the app settings. Upon deletion, all your data including 
                journeys and memories will be permanently removed.
              </p>
            </Section>

            <Section icon={<Gavel size={18} />} title="Indemnification">
              <p style={textStyle}>
                You agree to indemnify, defend, and hold harmless Kyle Seneker, and his affiliates, 
                officers, agents, and employees, from and against any and all claims, liabilities, 
                damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising 
                out of or in any way connected with: (a) your access to or use of the Service; 
                (b) your User Content; (c) your violation of these Terms; or (d) your violation 
                of any rights of any third party.
              </p>
            </Section>

            <Section icon={<Globe size={18} />} title="Governing Law">
              <p style={textStyle}>
                These Terms shall be governed by and construed in accordance with the laws of 
                the State of California, United States, without regard to its conflict of law 
                provisions. Any disputes arising from these Terms or your use of Sunroof shall 
                be resolved in the courts located in California.
              </p>
            </Section>

            <Section icon={<RefreshCw size={18} />} title="Modifications to Terms">
              <p style={textStyle}>
                We reserve the right to modify these Terms at any time in our sole discretion. 
                If we make material changes, we will notify you by posting the updated Terms 
                within the Service and updating the &quot;Last updated&quot; date above. Your continued 
                use of the Service following the posting of revised Terms constitutes your 
                acceptance of such changes. If you do not agree to the modified Terms, you 
                must discontinue your use of the Service.
              </p>
            </Section>

            <Section icon={<FileText size={18} />} title="Severability">
              <p style={textStyle}>
                If any provision of these Terms is held to be invalid, illegal, or unenforceable 
                by a court of competent jurisdiction, such invalidity shall not affect the 
                validity of the remaining provisions, which shall remain in full force and effect.
              </p>
            </Section>

            <Section icon={<FileText size={18} />} title="Entire Agreement">
              <p style={textStyle}>
                These Terms, together with our Privacy Policy, constitute the entire agreement 
                between you and Kyle Seneker regarding your use of the Service and supersede 
                all prior agreements, understandings, and communications, whether written or oral.
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
