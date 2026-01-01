import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(249, 115, 22, 0.3) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 40%)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #f97316, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 20,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 64,
              fontWeight: 300,
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            Sunroof
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            background: 'linear-gradient(90deg, #f97316, #ec4899)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 20,
          }}
        >
          Capture now, relive later.
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 24,
            color: '#71717a',
            maxWidth: 600,
            textAlign: 'center',
          }}
        >
          The delayed camera. Your memories unlock when you&apos;re ready.
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

