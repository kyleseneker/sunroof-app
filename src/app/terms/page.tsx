'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { IconButton } from '@/components/ui';

export default function TermsOfService() {
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
            <h1 className="text-3xl font-light text-white mb-2">Terms of Service</h1>
            <p className="text-white/40 text-sm">Last updated: December 29, 2025</p>
          </div>

          {/* Content card */}
          <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 space-y-8">
            <section>
              <h2 className="text-lg font-medium text-white mb-3">Acceptance of Terms</h2>
              <p className="text-white/60 leading-relaxed">
                By accessing or using Sunroof, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the app.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">Description of Service</h2>
              <p className="text-white/60 leading-relaxed">
                Sunroof is a &quot;delayed camera&quot; application that allows you to capture photos and notes 
                during trips, which remain locked until a chosen unlock date. This creates an authentic, 
                unedited record of your experiences.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">User Content</h2>
              <ul className="text-white/60 leading-relaxed space-y-2">
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>You retain all rights to the content you create and upload</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>You are responsible for the content you capture</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Do not upload content that violates any laws or third-party rights</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">Acceptable Use</h2>
              <p className="text-white/60 mb-2">You agree not to:</p>
              <ul className="text-white/60 leading-relaxed space-y-2">
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Use the service for any illegal purpose</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Upload harmful, offensive, or inappropriate content</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Attempt to circumvent any security features</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Interfere with the proper functioning of the service</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">Disclaimer</h2>
              <p className="text-white/60 leading-relaxed">
                The service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee 
                that the service will be uninterrupted, secure, or error-free. Use at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">Limitation of Liability</h2>
              <p className="text-white/60 leading-relaxed">
                To the maximum extent permitted by law, we shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">Changes to Terms</h2>
              <p className="text-white/60 leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the service 
                after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white mb-3">Contact</h2>
              <p className="text-white/60 leading-relaxed">
                For questions about these Terms, contact us at{' '}
                <a href="mailto:hello@getsunroof.com" className="text-amber-400 hover:underline">
                  hello@getsunroof.com
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
