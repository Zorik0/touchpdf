export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--signal)" />
      <path d="M22 2v7a1 1 0 0 0 1 1h7" fill="rgb(255 255 255 / 0.35)" />
      <circle cx="16" cy="17" r="3" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="16" cy="17" r="7" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.5" />
    </svg>
  );
}
