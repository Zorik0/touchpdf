import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          background: 'transparent',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoBg" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#e8734a" />
              <stop offset="100%" stopColor="#f4a261" />
            </linearGradient>
          </defs>
          
          <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#logoBg)" />
          <path d="M22 2V9C22 9.55228 22.4477 10 23 10H30" fill="rgba(255,255,255,0.3)" />
          <circle cx="16" cy="17" r="3" stroke="white" strokeWidth="2" strokeOpacity="0.9" fill="none" />
          <circle cx="16" cy="17" r="7" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
          <circle cx="16" cy="17" r="11" stroke="white" strokeWidth="1" strokeOpacity="0.15" fill="none" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
