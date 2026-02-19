import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function Logo({ size = 32, className = '', showText = true }: LogoProps) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
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
        
        {/* Rounded document */}
        <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#logoBg)" />
        
        {/* Folded corner */}
        <path d="M22 2V9C22 9.55228 22.4477 10 23 10H30" fill="rgba(255,255,255,0.3)" />
        
        {/* Touch ripple lines */}
        <circle cx="16" cy="17" r="3" stroke="white" strokeWidth="2" strokeOpacity="0.9" fill="none" />
        <circle cx="16" cy="17" r="7" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
        <circle cx="16" cy="17" r="11" stroke="white" strokeWidth="1" strokeOpacity="0.15" fill="none" />
      </svg>
      {showText && (
        <span style={{ 
          fontSize: size * 0.55, 
          fontWeight: 700, 
          color: '#e8e8ed',
          letterSpacing: '-0.02em'
        }}>
          touch<span style={{ color: '#e8734a' }}>pdf</span>
        </span>
      )}
    </div>
  );
}
