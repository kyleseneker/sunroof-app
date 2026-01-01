'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowRight, Loader2, Sparkles, HelpCircle, X, Camera, Lock, Unlock } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // OTP code entry (Supabase uses 8-character tokens)
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  // Show success screen after OTP verification
  if (loginSuccess) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-light mb-3">You&apos;re in!</h1>
        <p className="text-zinc-500 max-w-xs mb-8">
          Welcome to Sunroof. Tap below to start your journey.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full max-w-xs h-14 bg-white text-black rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-100 active:scale-[0.98] transition-all"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center safe-top safe-bottom">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
          <Mail className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-light mb-2">Check your email</h1>
        <p className="text-zinc-500 max-w-xs mb-4">
          We sent a login link to <span className="text-white">{email}</span>
        </p>
        
        <p className="text-zinc-600 text-sm mb-6">
          Click the link in your email to sign in, or enter the code below:
        </p>

        {/* OTP Input */}
        <div className="flex gap-2 mb-4" onPaste={handleOtpPaste}>
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
              className="w-10 h-12 text-center text-xl font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-50 transition-all"
              autoFocus={index === 0}
            />
          ))}
        </div>

        {verifying && (
          <div className="flex items-center gap-2 text-zinc-400 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Verifying...</span>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="space-y-3">
          <button
            onClick={resendCode}
            disabled={loading}
            className="text-sm text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Resend code'}
          </button>
          <span className="text-zinc-700 mx-3">•</span>
          <button
            onClick={() => { 
              sessionStorage.removeItem('otp-email');
              sessionStorage.removeItem('otp-sent');
              setSent(false); 
              setEmail(''); 
              setOtp(['', '', '', '', '', '', '', '']); 
            }}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Use different email
          </button>
        </div>
      </div>
    );
  }

  // Help Modal - matches Dashboard help for consistency
  if (showHelp) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col safe-top safe-bottom">
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <button 
            onClick={() => setShowHelp(false)} 
            className="self-end w-10 h-10 flex items-center justify-center rounded-full bg-white/5 mb-6"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
          
          <div className="max-w-sm mx-auto w-full">
            <div className="flex items-center gap-3 mb-8">
              <Image src="/icon.svg" alt="Sunroof" width={32} height={32} />
              <h2 className="text-2xl font-light">How Sunroof Works</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">1. Start a Journey</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Create a new journey before you go. Choose when your memories unlock.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">2. Capture Moments</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Take photos and write notes during your journey. They go straight to the vault, no peeking!
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">3. Wait for Unlock</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Your memories stay hidden until the timer expires. Stay present and enjoy the moment.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                  <Unlock className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">4. Relive the Magic</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    When time&apos;s up, open your vault and rediscover your journey. Like developing film!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-2xl p-5 mt-8">
              <h3 className="font-medium mb-2">Why lock your photos?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                When you can&apos;t review and edit during a journey, you stay more present. 
                And when you finally unlock them, you rediscover the experience all over again.
              </p>
            </div>
            
            <button 
              onClick={() => setShowHelp(false)}
              className="w-full h-14 bg-white text-black rounded-full font-semibold text-sm mt-8 hover:bg-zinc-100 active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col safe-top safe-bottom">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-orange-500/20 to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col justify-between p-8 relative z-10">
        {/* Top: Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/icon.svg" alt="Sunroof" width={28} height={28} />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-zinc-400">Sunroof</span>
          </div>
          <button 
            onClick={() => setShowHelp(true)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Middle: Login Form */}
        <div className="max-w-sm w-full mx-auto">
          <h1 className="text-4xl font-light mb-3">
            Capture now,<br />relive later.
          </h1>
          <p className="text-zinc-500 mb-8">
            Sunroof saves your moments until you&apos;re ready.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:bg-black transition-all input-premium"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={!email.trim() || loading}
              className="group w-full h-14 bg-white text-black rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 active:scale-[0.98] transition-all btn-shine shadow-lg shadow-white/10"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom: Info & Legal */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-zinc-600">
              No password needed. We&apos;ll send you a login link.
            </p>
            <button 
              onClick={() => setShowHelp(true)}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              What is Sunroof?
            </button>
          </div>
          
          {/* Legal Links */}
          <div className="pt-4 border-t border-zinc-900 space-y-2">
            <nav className="text-xs text-zinc-600 text-center">
              <a href="/privacy" className="hover:text-zinc-400 transition-colors">
                Privacy Policy
              </a>
              <span className="mx-3 text-zinc-700">•</span>
              <a href="/terms" className="hover:text-zinc-400 transition-colors">
                Terms of Service
              </a>
            </nav>
            <p className="text-[10px] text-zinc-700">
              © {new Date().getFullYear()} Sunroof. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
