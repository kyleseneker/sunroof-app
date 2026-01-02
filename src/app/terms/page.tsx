'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
          <h1 className="text-lg font-medium">Terms of Service</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-2xl mx-auto p-6">
          <p className="text-sm text-zinc-600 mb-8">Last updated: December 29, 2025</p>

          <div className="space-y-8 text-zinc-400 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Acceptance of Terms</h2>
              <p>
                By accessing or using Sunroof, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Description of Service</h2>
              <p>
                Sunroof is a &quot;delayed camera&quot; application that allows you to capture photos and notes 
                during trips, which remain locked until a chosen unlock date. This creates an authentic, 
                unedited record of your experiences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">User Content</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You retain all rights to the content you create and upload</li>
                <li>You are responsible for the content you capture</li>
                <li>Do not upload content that violates any laws or third-party rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Acceptable Use</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Use the service for any illegal purpose</li>
                <li>Upload harmful, offensive, or inappropriate content</li>
                <li>Attempt to circumvent any security features</li>
                <li>Interfere with the proper functioning of the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Disclaimer</h2>
              <p>
                The service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee 
                that the service will be uninterrupted, secure, or error-free. Use at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, we shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the service 
                after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
              <p>
                For questions about these Terms, contact us at{' '}
                <a href="mailto:hello@getsunroof.com" className="text-orange-400 hover:underline">
                  hello@getsunroof.com
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
