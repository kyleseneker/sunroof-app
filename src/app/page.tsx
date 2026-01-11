import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Main content - centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Logo - matching LoginHero exactly */}
        <div className="mb-6">
          <div 
            className="w-[88px] h-[88px] rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #451a03 0%, #431407 50%, #1e1b4b 100%)',
              boxShadow: '0 8px 24px rgba(249, 115, 22, 0.5)',
            }}
          >
            <Image 
              src="/icon.svg" 
              alt="Sunroof" 
              width={56} 
              height={56}
              className="text-white"
            />
          </div>
        </div>
        
        {/* App name - font-weight 300, 30px, letter-spacing 1px */}
        <h1 
          className="text-white mb-1"
          style={{ 
            fontSize: '30px', 
            fontWeight: 300, 
            letterSpacing: '1px' 
          }}
        >
          Sunroof
        </h1>
        
        {/* Tagline - 16px, rgba(255,255,255,0.6) */}
        <p 
          className="mb-8"
          style={{ 
            fontSize: '16px', 
            color: 'rgba(255, 255, 255, 0.6)' 
          }}
        >
          Capture now. Relive later.
        </p>
        
        {/* App Store Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <a 
            href="#" 
            className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-white text-black font-semibold hover:scale-105 active:scale-95 transition-transform"
            style={{ boxShadow: '0 10px 15px rgba(0, 0, 0, 0.15)' }}
            aria-label="Download on the App Store"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="text-left">
              <div className="text-[10px] opacity-70 leading-tight">Download on the</div>
              <div className="text-base leading-tight">App Store</div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
          </a>
          
          <a 
            href="#" 
            className="group flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-semibold hover:scale-105 active:scale-95 transition-all"
            style={{ 
              background: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
            aria-label="Get it on Google Play"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.56.68.56 1.13s-.22.86-.56 1.13l-2.17 1.25-2.49-2.49 2.49-2.49 2.17 1.47zM6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z"/>
            </svg>
            <div className="text-left">
              <div className="text-[10px] opacity-70 leading-tight">Get it on</div>
              <div className="text-base leading-tight">Google Play</div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          Coming soon to iOS and Android
        </p>
      </main>

      {/* Footer - fixed at bottom */}
      <footer className="px-6 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            <Image src="/icon.svg" alt="" width={16} height={16} />
            <span className="text-xs">© {new Date().getFullYear()} Kyle Seneker</span>
          </div>
          
          <nav className="flex items-center gap-4 text-xs">
            <Link 
              href="/help" 
              className="hover:text-white transition-colors"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              How It Works
            </Link>
            <Link 
              href="/support" 
              className="hover:text-white transition-colors"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              Support
            </Link>
            <Link 
              href="/privacy" 
              className="hover:text-white transition-colors"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="hover:text-white transition-colors"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              Terms
            </Link>
          </nav>
        </div>
        
        {/* Unsplash attribution */}
        <div className="max-w-4xl mx-auto mt-2 text-center">
          <p className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
            Photo by{' '}
            <a 
              href="https://unsplash.com/@sohan_shingade?utm_source=sunroof&utm_medium=referral" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white/40"
            >
              Sohan Shingade
            </a>
            {' '}on{' '}
            <a 
              href="https://unsplash.com/?utm_source=sunroof&utm_medium=referral" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white/40"
            >
              Unsplash
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
