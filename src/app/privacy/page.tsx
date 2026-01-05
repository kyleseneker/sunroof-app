'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { IconButton } from '@/components/ui';

export default function PrivacyPolicy() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden safe-top safe-bottom">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950">
        {/* Ambient orbs */}
        <div className="absolute top-20 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4">
        <Link href="/login">
          <IconButton 
            icon={<ChevronLeft className="w-5 h-5" />}
            label="Back"
            variant="ghost"
            dark
          />
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-y-auto scrollbar-hide px-6 pb-6">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-white mb-2">Privacy Policy</h1>
            <p className="text-white/40 text-sm">Last updated: December 29, 2025</p>
          </div>

          {/* Content card */}
          <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 space-y-8">
            <section>
              <h2 className="text-lg font-medium text-white mb-3">Overview</h2>
              <p className="text-white/60 leading-relaxed">
                Sunroof (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, and safeguard your information 
                when you use our mobile application.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">Information We Collect</h2>
              <ul className="text-white/60 leading-relaxed space-y-2">
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span><strong className="text-white/80">Photos and Notes:</strong> Content you capture within the app is stored securely until your chosen unlock date.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span><strong className="text-white/80">Journey Data:</strong> Journey names, unlock dates, and timestamps you provide.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span><strong className="text-white/80">Device Information:</strong> Basic device identifiers for app functionality.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">How We Use Your Information</h2>
              <ul className="text-white/60 leading-relaxed space-y-2">
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>To provide the core app functionality (storing and unlocking memories)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>To improve our services and user experience</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>To ensure the security of your data</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">Data Storage</h2>
              <p className="text-white/60 leading-relaxed">
                Your photos and notes are stored securely using industry-standard encryption. 
                We use Supabase as our backend provider, which maintains SOC 2 Type II compliance.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">Your Rights</h2>
              <ul className="text-white/60 leading-relaxed space-y-2">
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Access your personal data at any time</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Delete your data through the app settings</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Export your memories after they unlock</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">Contact Us</h2>
              <p className="text-white/60 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@getsunroof.com" className="text-amber-400 hover:underline">
                  privacy@getsunroof.com
                </a>
              </p>
            </section>
          </div>
          
          {/* Footer */}
          <footer className="mt-8 text-center">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Sunroof. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
