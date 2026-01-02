'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Header - matches app styling */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="flex items-center gap-4 p-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-medium">Privacy Policy</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-2xl mx-auto p-6">
          <p className="text-sm text-zinc-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-8 text-zinc-400 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Overview</h2>
              <p>
                Sunroof (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, and safeguard your information 
                when you use our mobile application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-zinc-300">Photos and Notes:</strong> Content you capture within the app is stored securely until your chosen unlock date.</li>
                <li><strong className="text-zinc-300">Journey Data:</strong> Journey names, unlock dates, and timestamps you provide.</li>
                <li><strong className="text-zinc-300">Device Information:</strong> Basic device identifiers for app functionality.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide the core app functionality (storing and unlocking memories)</li>
                <li>To improve our services and user experience</li>
                <li>To ensure the security of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Data Storage</h2>
              <p>
                Your photos and notes are stored securely using industry-standard encryption. 
                We use Supabase as our backend provider, which maintains SOC 2 Type II compliance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access your personal data at any time</li>
                <li>Delete your data through the app settings</li>
                <li>Export your memories after they unlock</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@getsunroof.com" className="text-orange-400 hover:underline">
                  privacy@getsunroof.com
                </a>
              </p>
            </section>
          </div>
          
          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-600">
              © {new Date().getFullYear()} Sunroof. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
