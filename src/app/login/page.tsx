'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib';
import { Mail, ArrowRight, Loader2, HelpCircle } from 'lucide-react';
import { HelpModal } from '@/components/features';
import { IconButton } from '@/components/ui';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Background image
  const [bgImage, setBgImage] = useState<string | null>(null);
  
  // OTP code entry (Supabase uses 8-character tokens)
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Fetch background image via API route
  useEffect(() => {
    async function fetchBg() {
      try {
        const res = await fetch('/api/cover-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'golden hour sunlight warm sky adventure freedom' }),
        });
        const data = await res.json();
        if (data.photo?.url) {
          setBgImage(data.photo.url);
        }
      } catch {
        // Fallback to gradient
      }
    }
    fetchBg();
  }, []);

  // Restore state from sessionStorage on mount (survives remounts)
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('otp-email');
    const storedSent = sessionStorage.getItem('otp-sent');
    if (storedEmail && storedSent === 'true') {
      setEmail(storedEmail);
      setSent(true);
    }
  }, []);

  // Check if already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Already logged in, clear OTP state and redirect
        sessionStorage.removeItem('otp-email');
        sessionStorage.removeItem('otp-sent');
        window.location.href = '/';
      } else {
        setCheckingSession(false);
      }
    };
    checkExistingSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // This sends both a magic link AND an OTP code
        shouldCreateUser: true,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Store in sessionStorage so state survives page remounts
      sessionStorage.setItem('otp-email', email.trim());
      sessionStorage.setItem('otp-sent', 'true');
      setSent(true);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // If successful, user will be redirected to Google
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last digit
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    // Focus last filled or next empty
    const focusIndex = Math.min(pasted.length, 7);
    inputRefs.current[focusIndex]?.focus();
  };

  // Auto-verify when all 8 digits entered
  useEffect(() => {
    const code = otp.join('');
    if (code.length === 8) {
      verifyOtp(code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const [loginSuccess, setLoginSuccess] = useState(false);

  const verifyOtp = async (code: string) => {
    setVerifying(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'email',
      });

      if (verifyError) {
        console.error('OTP verification error:', verifyError);
        setError('Invalid code. Please try again.');
        setOtp(['', '', '', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setVerifying(false);
        return;
      }

      // OTP verified successfully
      if (data.session) {
        // Clear OTP state from sessionStorage
        sessionStorage.removeItem('otp-email');
        sessionStorage.removeItem('otp-sent');
        
        // Session is automatically persisted by Supabase's built-in storage
        // (configured in lib/supabase.ts with storageKey: 'supabase-auth')
        
        // Show success screen instead of auto-redirect
        setLoginSuccess(true);
        setVerifying(false);
      } else {
        setError('Authentication succeeded but no session received. Please try again.');
        setVerifying(false);
      }
    } catch (err) {
      console.error('Unexpected error during OTP verification:', err);
      setError('Something went wrong. Please try again.');
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError(null);
    setOtp(['', '', '', '', '', '', '', '']);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  // Show loading while checking existing session
  if (checkingSession) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Show success screen after OTP verification
  if (loginSuccess) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {bgImage ? (
            <>
              <Image src={bgImage} alt="" fill sizes="100vw" className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950" />
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-40 left-10 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
              </div>
            </>
          )}
        </div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mb-8 mx-auto border border-white/20">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-light text-white mb-4">You&apos;re in!</h1>
          <p className="text-white/60 max-w-xs mb-10 mx-auto text-lg">
            Welcome to Sunroof. Your adventure awaits.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full max-w-xs h-14 bg-white text-gray-900 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all shadow-2xl mx-auto"
          >
            Start Exploring
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center safe-top safe-bottom overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {bgImage ? (
            <>
              <Image src={bgImage} alt="" fill sizes="100vw" className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950" />
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-40 right-10 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
              </div>
            </>
          )}
        </div>
        
        <div className="relative z-10 w-full max-w-sm">
          {/* Glassmorphism card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 mx-auto border border-white/20">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-light text-white mb-2">Check your email</h1>
            <p className="text-white/60 mb-2">
              We sent a code to
            </p>
            <p className="text-white font-medium mb-6">{email}</p>

            {/* OTP Input */}
            <div className="flex gap-2 mb-4 justify-center" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  disabled={verifying}
                  className="w-10 h-12 text-center text-xl font-mono bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/50 focus:bg-white/15 disabled:opacity-50 transition-all"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {verifying && (
              <div className="flex items-center justify-center gap-2 text-white/60 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Verifying...</span>
              </div>
            )}

            {error && (
              <p className="text-red-300 text-sm mb-4">{error}</p>
            )}
            
            <p className="text-white/40 text-xs mb-4">
              Or click the link in your email
            </p>

            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                onClick={resendCode}
                disabled={loading}
                className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Resend'}
              </button>
              <span className="text-white/20">•</span>
              <button
                onClick={() => { 
                  sessionStorage.removeItem('otp-email');
                  sessionStorage.removeItem('otp-sent');
                  setSent(false); 
                  setEmail(''); 
                  setOtp(['', '', '', '', '', '', '', '']); 
                }}
                className="text-white/50 hover:text-white transition-colors"
              >
                Change email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)}>
      <div className="glass rounded-2xl p-5 mt-8">
        <h3 className="font-medium mb-2">Why lock your photos?</h3>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
          When you can&apos;t review and edit during a journey, you stay more present. 
          And when you finally unlock them, you rediscover the experience all over again.
        </p>
      </div>
    </HelpModal>
    
    {showHelp ? null : (
    <div className="fixed inset-0 flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Full-screen background */}
      <div className="absolute inset-0">
        {bgImage ? (
          <>
            <Image
              src={bgImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950" />
            {/* Ambient orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-20 right-10 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-40 left-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between p-6 md:p-8 relative z-10">
        {/* Top: Brand */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/icon.svg" alt="Sunroof" width={28} height={28} className="brightness-0 invert opacity-90" />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/70">Sunroof</span>
          </div>
          <IconButton 
            icon={<HelpCircle className="w-4 h-4" />}
            label="How Sunroof works"
            onClick={() => setShowHelp(true)}
            variant="ghost"
            dark
          />
        </header>

        {/* Middle: Login Form */}
        <main className="max-w-sm w-full mx-auto">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4 text-center">
            Capture now.<br />
            <span className="text-white/50">Relive later.</span>
          </h1>
          <p className="text-white/60 mb-10 text-center max-w-xs mx-auto">
            Your memories stay locked until you&apos;re ready to rediscover them.
          </p>

          {/* Glassmorphism form container */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                  required
                />
              </div>

              {error && (
                <p className="text-red-300 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={!email.trim() || loading || googleLoading}
                className="group w-full h-14 bg-white text-gray-900 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 active:scale-[0.98] transition-all shadow-2xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue with Email
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-5">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-xs text-white/40 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full h-14 bg-white/10 border border-white/20 rounded-full font-medium flex items-center justify-center gap-3 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/15 hover:border-white/30 active:scale-[0.98] transition-all"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#fff"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#fff"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#fff"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#fff"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>
        </main>

        {/* Bottom: Legal */}
        <footer className="text-center space-y-2">
          <nav className="text-xs text-white/40 text-center">
            <a href="/privacy" className="hover:text-white/70 transition-colors">
              Privacy
            </a>
            <span className="mx-3 text-white/20">•</span>
            <a href="/terms" className="hover:text-white/70 transition-colors">
              Terms
            </a>
          </nav>
          <p className="text-[10px] text-white/30">
            © {new Date().getFullYear()} Sunroof
          </p>
        </footer>
      </div>
    </div>
    )}
    </>
  );
}
