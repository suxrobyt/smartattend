// SmartAttend logo: navy tile with a gold frame, a student's mortarboard and a green check badge
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="sa-bg" x1="8" y1="0" x2="56" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2540a8" />
          <stop offset="1" stopColor="#0c1033" />
        </linearGradient>
        <linearGradient id="sa-gl" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sa-cap" x1="8" y1="10" x2="56" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9ec5ff" />
        </linearGradient>
        <linearGradient id="sa-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="sa-ok" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
        <filter id="sa-ds" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      <rect width="64" height="64" rx="17" fill="url(#sa-bg)" />
      <rect width="64" height="64" rx="17" fill="url(#sa-gl)" />
      <rect x="1" y="1" width="62" height="62" rx="16" fill="none" stroke="#fbbf24" strokeOpacity="0.55" strokeWidth="1.8" />
      <g filter="url(#sa-ds)">
        <path d="M17 29v10.5c0 3.6 6.7 6.8 15 6.8s15-3.2 15-6.8V29L32 36z" fill="#b9d3ff" />
        <path d="M32 10 58 22.5 32 35 6 22.5z" fill="url(#sa-cap)" />
        <path d="M32 22.5 54 26.5v10" fill="none" stroke="url(#sa-gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="54" cy="39" r="3.2" fill="url(#sa-gold)" />
      </g>
      <circle cx="32" cy="22.5" r="2.4" fill="#f59e0b" />
      <circle cx="45" cy="48" r="9.4" fill="url(#sa-ok)" stroke="#0c1033" strokeWidth="3" />
      <path d="M40.7 48.2 43.9 51.4 49.8 44.6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
