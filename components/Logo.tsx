// SmartAttend logo: a glossy rounded tile with a check mark inside a soft ring
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="sa-bg" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6aa4ff" />
          <stop offset="0.55" stopColor="#3f7df2" />
          <stop offset="1" stopColor="#19c4e6" />
        </linearGradient>
        <linearGradient id="sa-gloss" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill="url(#sa-bg)" />
      <rect width="64" height="64" rx="17" fill="url(#sa-gloss)" />
      <circle cx="32" cy="32" r="18" fill="#fff" fillOpacity="0.14" stroke="#fff" strokeOpacity="0.5" strokeWidth="2.5" />
      <path d="M22.5 33.5l7.2 7.2L42.5 25" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
