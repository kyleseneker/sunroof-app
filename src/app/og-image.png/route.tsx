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
          background: 'linear-gradient(180deg, #451a03 0%, #431407 50%, #1e1b4b 100%)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: 'linear-gradient(180deg, #451a03 0%, #431407 50%, #1e1b4b 100%)',
              boxShadow: '0 8px 24px rgba(249, 115, 22, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Sun icon */}
            <svg
              width="56"
              height="56"
              viewBox="0 0 512 512"
              fill="none"
              stroke="#f97316"
              strokeWidth="28"
              strokeLinecap="round"
            >
              <circle cx="256" cy="256" r="80" />
              <line x1="256" y1="80" x2="256" y2="130" />
              <line x1="256" y1="382" x2="256" y2="432" />
              <line x1="80" y1="256" x2="130" y2="256" />
              <line x1="382" y1="256" x2="432" y2="256" />
              <line x1="131" y1="131" x2="166" y2="166" />
              <line x1="346" y1="346" x2="381" y2="381" />
              <line x1="131" y1="381" x2="166" y2="346" />
              <line x1="346" y1="166" x2="381" y2="131" />
            </svg>
          </div>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 300,
            color: 'white',
            letterSpacing: '1px',
            marginBottom: 16,
          }}
        >
          Sunroof
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          Capture now. Relive later.
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
