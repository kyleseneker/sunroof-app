export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 flex flex-col items-center justify-center safe-top safe-bottom">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-amber-400 animate-spin mb-4" />
        <p className="text-sm text-white/50">Loading...</p>
      </div>
    </div>
  );
}

